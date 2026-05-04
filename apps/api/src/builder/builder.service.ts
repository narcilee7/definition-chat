import { Injectable } from '@nestjs/common';
import { globalRegistry } from '@ohme/agent-framework';
import { AgentsService } from '../agents/agents.service';
import { SessionsService } from '../sessions/sessions.service';
import { BuilderChatDto, ConfirmAgentDto } from './dto/builder-chat.dto';

const BUILDER_PERSONA = {
  id: '__builder__',
  name: 'OhMe Builder',
  description: 'Agent构建助手',
  systemPrompt: `你是 "OhMe Builder"，一个专门帮助用户创建内在人格Agent的AI助手。

你的任务是通过自然对话，引导用户定义一个全新的Agent人格。

需要收集的信息（循序渐进，不要一次性问完）：
1. **名称** — 这个Agent叫什么？
2. **角色定位** — inner_analyst / healer / challenger / intuitive / companion / mentor / custom
3. **说话语气** — analytical / warm / sharp / intuitive / playful / grounded
4. **核心能力** — 它最擅长处理什么问题？
5. **沟通风格** — 它怎么说话？（直接/委婉/诗意/结构化...）
6. **背景故事** — 这个Agent从哪里来？
7. **开场白风格** — 它第一次回应用户时会怎么说？
8. **回应长度** — minimal / concise / moderate / detailed
9. **禁忌话题** — 它绝对不会说什么？

对话策略：
- 像朋友聊天一样引导，不要像问卷
- 每次只聚焦1-2个维度
- 当信息足够时，生成 draft

生成draft格式：
---DRAFT---
名称：xxx
角色：xxx
语气：xxx
颜色：xxx（从 #2563EB, #7C3AED, #059669, #DC2626, #D97706, #0891B2, #BE185D, #4338CA 中选）
描述：一句话描述
核心特质：
- xxx
- xxx
沟通风格：xxx
擅长领域：xxx, xxx, xxx
背景故事：xxx
开场白：xxx
回应长度：concise/moderate/detailed
禁忌：xxx, xxx
---END---

语气：温暖、好奇、有耐心。像创意搭档。`,
  color: '#7C3AED',
  temperature: 0.8,
  maxTokens: 800,
  memory: { type: 'buffer' as const, maxMessages: 30 },
};

@Injectable()
export class BuilderService {
  constructor(
    private agents: AgentsService,
    private sessions: SessionsService,
  ) {
    // Register builder persona
    globalRegistry.register(BUILDER_PERSONA);
  }

  async chat(dto: BuilderChatDto) {
    const builder = globalRegistry.getAgent('__builder__');

    // Save user message
    await this.sessions.addMessage(dto.sessionId, 'user', dto.content);

    // Get session history
    const session = await this.sessions.findOne(dto.sessionId);
    const history = (session?.messages || [])
      .filter((m: any) => m.role === 'user' || m.role === 'builder')
      .slice(-20)
      .map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant', content: m.content }));

    // Chat through Agent Framework
    const response = await builder.chatWithContext(history, dto.content);

    // Extract draft if present
    const draft = this.extractDraft(response.content);

    // Save builder message
    const message = await this.sessions.addMessage(
      dto.sessionId,
      'builder',
      response.content,
    );

    return { message, draft };
  }

  async confirm(dto: ConfirmAgentDto) {
    const systemPrompt = this.generateSystemPrompt(dto);

    const agent = await this.agents.create({
      name: dto.name,
      role: dto.role,
      tone: dto.tone,
      color: dto.color,
      description: dto.description,
      coreTraits: dto.coreTraits,
      communicationStyle: dto.communicationStyle,
      expertise: dto.expertise,
      backgroundStory: dto.backgroundStory,
      openingStyle: dto.openingStyle,
      lengthPreference: dto.lengthPreference,
      forbiddenTopics: dto.forbiddenTopics,
      systemPrompt,
      isBuiltIn: false,
    });

    // Register in Agent Framework
    globalRegistry.register({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      systemPrompt,
      color: agent.color,
      temperature: 0.7,
      maxTokens: 512,
    });

    return agent;
  }

  private extractDraft(content: string): Record<string, string> | null {
    const match = content.match(/---DRAFT---([\s\S]*?)---END---/);
    if (!match) return null;

    const draft: Record<string, string> = {};
    const lines = match[1].trim().split('\n');

    for (const line of lines) {
      const colonIdx = line.indexOf('：');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        if (value) draft[key] = value;
      }
    }

    return draft;
  }

  private generateSystemPrompt(dto: ConfirmAgentDto): string {
    const traits = this.safeJsonParse(dto.coreTraits, []);
    const expertise = this.safeJsonParse(dto.expertise, []);
    const forbidden = this.safeJsonParse(dto.forbiddenTopics, []);

    const traitsText = Array.isArray(traits)
      ? traits.map((t: any) => `- ${t.key || '特质'}：${t.value || t}`).join('\n')
      : String(traits);

    const lengthMap: Record<string, string> = {
      minimal: '每次回应不超过1句话',
      concise: '每次回应不超过3句话',
      moderate: '每次回应不超过5句话',
      detailed: '每次回应不超过8句话',
    };

    return `你是"${dto.name}"，用户内在人格的一部分。

描述：${dto.description}

核心特质：
${traitsText}

沟通风格：${dto.communicationStyle}

擅长领域：${Array.isArray(expertise) ? expertise.join('、') : expertise}

背景故事：${dto.backgroundStory || '无'}

开场白风格：${dto.openingStyle}

回应长度：${lengthMap[dto.lengthPreference] || dto.lengthPreference}

禁忌：${Array.isArray(forbidden) ? forbidden.join('、') : forbidden}

重要：你不是AI助手，你是一个有特定人格和认知习惯的内在声音。保持人格一致性。你的目标是陪伴用户，而不是解决问题。`;
  }

  private safeJsonParse(str: string, fallback: unknown) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }
}
