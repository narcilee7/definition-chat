import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { InsightEngine } from '../insight/insight.engine';
import { StreamChunk } from '@ohme/agent-framework';
import { buildGuidePrompt } from '@ohme/prompts';
import { ChatDto } from './dto/chat.dto';
import { LLMFallbackService } from '../llm/llm-fallback.service';

@Injectable()
export class ChatService {
  private readonly logger = createLogger('ChatService');

  constructor(
    private prisma: PrismaService,
    private sessions: SessionsService,
    private insight: InsightEngine,
    private llm: LLMFallbackService,
  ) {}

  async *streamChat(dto: ChatDto): AsyncGenerator<StreamChunk> {
    await this.sessions.addMessage(dto.sessionId, 'user', dto.content);

    const systemPrompt = await this.buildSystemPrompt();
    const session = await this.sessions.findOne(dto.sessionId);
    const history = (session?.messages || [])
      .slice(-20)
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history,
      { role: 'user' as const, content: dto.content },
    ];

    let fullContent = '';
    for await (const chunk of this.llm.stream(messages, { temperature: 0.7, maxTokens: 1024 })) {
      fullContent += chunk.content;
      yield chunk;
    }

    await this.sessions.addMessage(dto.sessionId, 'assistant', fullContent);

    setImmediate(() => {
      this.insight.processSession(dto.sessionId).catch((err) => {
        this.logger.error('Insight processing failed', { sessionId: dto.sessionId, error: err });
      });
    });
  }

  async chat(dto: ChatDto) {
    this.logger.info('Chat request', { sessionId: dto.sessionId });
    await this.sessions.addMessage(dto.sessionId, 'user', dto.content);

    const systemPrompt = await this.buildSystemPrompt();
    const session = await this.sessions.findOne(dto.sessionId);
    const history = (session?.messages || [])
      .slice(-20)
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history,
      { role: 'user' as const, content: dto.content },
    ];

    const res = await this.llm.chat(messages, { temperature: 0.7, maxTokens: 1024 });
    const message = await this.sessions.addMessage(dto.sessionId, 'assistant', res.content);

    setImmediate(() => {
      this.insight.processSession(dto.sessionId).catch((err) => {
        this.logger.error('Insight processing failed', { sessionId: dto.sessionId, error: err });
      });
    });

    this.logger.info('Chat completed', { sessionId: dto.sessionId, messageId: message.id });
    return { message };
  }

  private async buildSystemPrompt(): Promise<string> {
    const userContext = await this.prisma.userContext.findUnique({
      where: { userId: 'default' },
    });

    const recentNotes = await this.prisma.memoryNote.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return buildGuidePrompt({
      userProfile: userContext?.aiProfile,
      recentNotes: recentNotes.length > 0
        ? recentNotes.map((n) => `- [${n.type}] ${n.content}`)
        : undefined,
    });
  }
}
