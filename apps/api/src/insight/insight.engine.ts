import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMProviderFactory, ProviderName } from '@ohme/agent-framework';

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
        {
          role: 'system',
          content:
            '你是一位资深心理咨询师。请根据以下对话记录，用3-5句话写一段 session 摘要。捕捉核心情绪、关键发现、用户展现的模式。语言要温暖、专业、准确。',
        },
        { role: 'user', content: transcript },
      ],
      { temperature: 0.5, maxTokens: 512 },
    );
    return res.content.trim();
  }

  private async extractMemoryNotes(transcript: string): Promise<ExtractedNotes> {
    const schemaDescription = JSON.stringify({
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              content: { type: 'string' },
              confidence: { type: 'number' },
            },
            required: ['type', 'content', 'confidence'],
          },
        },
      },
      required: ['notes'],
    }, null, 2);

    const res = await provider.chat(
      [
        {
          role: 'system',
          content: `从对话中提取值得长期记忆的洞察。只输出纯 JSON，严格遵守以下 JSON Schema：

${schemaDescription}

要求：
- 只输出纯 JSON，不要有任何 markdown 代码块标记
- 每个 note 的 type 是自由标签（如 emotion, belief, pattern, event, relationship, value, fear, desire 等）
- 只提取高置信度、有持久价值的洞察，不要提取琐碎信息`,
        },
        { role: 'user', content: transcript },
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

    const contextPrompt = existing
      ? `当前用户画像：\n${existing.aiProfile}\n\n最近会话摘要：\n${notes}\n\n请基于以上信息和新对话，更新用户画像。保持简洁（200字以内），捕捉核心特征。`
      : `请根据以下对话记录，写一段简洁的用户画像（200字以内），捕捉这个人的核心特征、情绪模式、关注议题。\n\n对话记录：\n${transcript}`;

    const res = await provider.chat(
      [
        {
          role: 'system',
          content:
            '你是一位心理咨询师。你的任务是为用户维护一份"心理画像"——一段自然语言描述，概括这个人的核心特征、情绪模式、关注议题和沟通偏好。画像应该简洁、准确、温暖。',
        },
        { role: 'user', content: contextPrompt },
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
