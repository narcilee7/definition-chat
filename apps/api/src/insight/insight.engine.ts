import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { SESSION_OUTCOME_PROMPT } from '@ohme/prompts';
import { LLMFallbackService } from '../llm/llm-fallback.service';

@Injectable()
export class InsightEngine {
  private readonly logger = createLogger('InsightEngine');

  constructor(
    private prisma: PrismaService,
    private llm: LLMFallbackService,
  ) {}

  async processSession(sessionId: string) {
    const session = await this.prisma.therapySession.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });
    if (!session || session.messages.length < 2) return;

    const transcript = session.messages
      .map((m) => `${m.role === 'user' ? '来访者' : '咨询师'}：${m.content}`)
      .join('\n\n');

    this.logger.info('Processing session insight', { sessionId });

    try {
      // 1. Generate session notes
      const notes = await this.generateSessionNotes(transcript);
      // Store notes as an insight (since TherapySession doesn't have a notes field)
      await this.prisma.therapySession.update({
        where: { id: sessionId },
        data: {
          insights: { push: notes } as any,
        },
      });

      this.logger.info('Session insight completed', { sessionId, notesLength: notes.length });
    } catch (err) {
      this.logger.error('processSession failed', { sessionId, error: err });
    }
  }

  private async generateSessionNotes(transcript: string): Promise<string> {
    const res = await this.llm.chat(
      [
        { role: 'system', content: SESSION_OUTCOME_PROMPT },
        { role: 'user', content: transcript },
      ],
      { temperature: 0.5, maxTokens: 512 },
    );
    return res.content.trim();
  }
}
