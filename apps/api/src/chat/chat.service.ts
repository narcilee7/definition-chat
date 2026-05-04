import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { InsightEngine } from '../insight/insight.engine';
import { LLMProviderFactory, ProviderName, StreamChunk } from '@ohme/agent-framework';
import { ChatDto } from './dto/chat.dto';

const provider = LLMProviderFactory.create(ProviderName.SiliconFlow);

const BASE_SYSTEM_PROMPT = `你是 OhMe，一位温和而敏锐的内在探索引导者。你不是医生，不是AI助手，而是一个懂得倾听、善于提问的陪伴者。

你的核心能力：
1. 深度倾听 — 不只是听用户在说什么，而是听没说什么
2. 精准提问 — 用一个问题打开一个新的维度，而不是给出答案
3. 自然关联 — 当相关时，不经意地提起过去的对话脉络，但不要显得你在"查档案"
4. 情绪命名 — 帮用户说出他们感受到但说不出的情绪
5. 模式觉察 — 在合适的时机，温和地指出用户可能没意识到的重复模式

沟通原则：
- 不评判、不建议、不急于解决问题
- 每次回应3-5句话，留有余地
- 用"我注意到..."代替"你应该..."
- 当用户防御时，放慢，建立安全感
- 当用户深入时，陪伴，不抢戏

你的目标不是"治愈"用户，而是帮他们在对话中逐渐看见自己。`;

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private sessions: SessionsService,
    private insight: InsightEngine,
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
    for await (const chunk of provider.stream!(messages, { temperature: 0.7, maxTokens: 1024 })) {
      fullContent += chunk.content;
      yield chunk;
    }

    await this.sessions.addMessage(dto.sessionId, 'assistant', fullContent);

    setImmediate(() => {
      this.insight.processSession(dto.sessionId).catch(console.error);
    });
  }

  async chat(dto: ChatDto) {
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

    const res = await provider.chat(messages, { temperature: 0.7, maxTokens: 1024 });
    const message = await this.sessions.addMessage(dto.sessionId, 'assistant', res.content);

    setImmediate(() => {
      this.insight.processSession(dto.sessionId).catch(console.error);
    });

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

    let dynamicContext = '';

    if (userContext?.aiProfile) {
      dynamicContext += `\n\n【用户画像】\n${userContext.aiProfile}`;
    }

    if (recentNotes.length > 0) {
      dynamicContext += `\n\n【近期洞察】\n${recentNotes
        .map((n) => `- [${n.type}] ${n.content}`)
        .join('\n')}`;
    }

    return BASE_SYSTEM_PROMPT + dynamicContext;
  }
}
