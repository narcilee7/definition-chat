import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMProviderFactory, ProviderName } from '@ohme/agent-framework';
import {
  sessionNotesPrompt,
  MEMORY_EXTRACTION_SYSTEM,
  memoryExtractionPrompt,
  PROFILE_UPDATE_SYSTEM,
  profileUpdatePrompt,
} from '@ohme/prompts';

const provider = LLMProviderFactory.create(ProviderName.SiliconFlow);

interface ExtractedNotes {
  notes: Array<{
    type: string;
    content: string;
    confidence: number;
  }>;
}

@Injectable()
export class InsightEngine {
  constructor(private prisma: PrismaService) {}

  async processSession(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });
    if (!session || session.messages.length < 2) return;

    const transcript = session.messages
      .map((m) => `${m.role === 'user' ? '用户' : '引导者'}：${m.content}`)
      .join('\n\n');

    try {
      // 1. Generate session notes
      const notes = await this.generateSessionNotes(transcript);
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { notes },
      });

      // 2. Extract memory notes
      const extracted = await this.extractMemoryNotes(transcript);
      for (const note of extracted.notes) {
        await this.prisma.memoryNote.create({
          data: {
            type: note.type,
            content: note.content,
            confidence: note.confidence,
            sourceIds: JSON.stringify([sessionId]),
          },
        });
      }

      // 3. Update user context
      await this.updateUserContext(transcript, notes);
    } catch (err) {
      console.error('[InsightEngine] processSession failed:', err);
    }
  }

  private async generateSessionNotes(transcript: string): Promise<string> {
    const res = await provider.chat(
      [
        { role: 'system', content: sessionNotesPrompt(transcript) },
        { role: 'user', content: transcript },
      ],
      { temperature: 0.5, maxTokens: 512 },
    );
    return res.content.trim();
  }

  private async extractMemoryNotes(transcript: string): Promise<ExtractedNotes> {
    const res = await provider.chat(
      [
        { role: 'system', content: MEMORY_EXTRACTION_SYSTEM },
        { role: 'user', content: memoryExtractionPrompt(transcript) },
      ],
      { temperature: 0.3, maxTokens: 1024 },
    );

    const cleaned = res.content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .trim();

    try {
      return JSON.parse(cleaned) as ExtractedNotes;
    } catch {
      return { notes: [] };
    }
  }

  private async updateUserContext(transcript: string, notes: string) {
    const existing = await this.prisma.userContext.findUnique({
      where: { userId: 'default' },
    });

    const prompt = profileUpdatePrompt({
      existingProfile: existing?.aiProfile,
      recentNotes: notes,
      transcript: existing ? undefined : transcript,
    });

    const res = await provider.chat(
      [
        { role: 'system', content: PROFILE_UPDATE_SYSTEM },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.5, maxTokens: 512 },
    );

    const allNotes = await this.prisma.memoryNote.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const keyTopics = [...new Set(allNotes.map((n) => n.type))].slice(0, 10);

    await this.prisma.userContext.upsert({
      where: { userId: 'default' },
      update: {
        aiProfile: res.content.trim(),
        keyTopics: JSON.stringify(keyTopics),
        updatedAt: new Date(),
      },
      create: {
        userId: 'default',
        aiProfile: res.content.trim(),
        keyTopics: JSON.stringify(keyTopics),
        sensitivities: JSON.stringify([]),
        stylePrefs: JSON.stringify({}),
      },
    });
  }
}
