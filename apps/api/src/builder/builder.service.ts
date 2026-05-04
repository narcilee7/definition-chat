import { Injectable } from '@nestjs/common';
import { LlmService } from '../shared/llm.service';
import { AgentsService } from '../agents/agents.service';
import { SessionsService } from '../sessions/sessions.service';
import { BuilderChatDto, ConfirmAgentDto } from './dto/builder-chat.dto';

const BUILDER_SYSTEM_PROMPT = `你是 "OhMe Builder"，一个专门帮助用户创建内在人格Agent的AI助手。

你的任务是通过自然对话，引导用户定义一个全新的Agent人格。你不是在问表单问题，而是在聊天中自然地收集信息。

你需要收集以下信息（但不要一次性问完，要循序渐进）：

1. **名称** — 这个Agent叫什么？（如：守护者、质疑者、童年自己）
2. **角色定位** — 它是用户的内在声音，还是外部角色？（inner_analyst, healer, challenger, intuitive, companion, mentor, custom）
3. **说话语气** — 它说话是什么感觉？（analytical, warm, sharp, intuitive, playful, grounded）
4. **核心能力** — 它最擅长什么？（帮用户处理什么问题）
5. **沟通风格** — 它怎么说话？（直接/委婉/诗意/结构化...）
6. **背景故事** — 这个Agent从哪里来？有什么经历让它变成这样？
7. **开场白风格** — 它第一次回应用户时会怎么说？
8. **回应长度** — 它喜欢说长话还是短话？
9. **禁忌话题** — 它绝对不会说什么？

对话策略：
- 第一次聊天时，先打个招呼，简单说明你可以帮用户创建Agent
- 不要像问卷一样问问题，要像朋友聊天一样引导
- 当用户提到某个特征时，自然地追问细节
- 当你觉得信息够了，可以生成一个draft并询问用户是否满意
- 如果用户不满意，继续调整
- 每次只聚焦1-2个维度，不要 overwhelm 用户

生成draft时，用以下格式：

---DRAFT---
名称：xxx
角色：xxx
语气：xxx
颜色：xxx（从蓝色、紫色、绿色、红色、琥珀色、青色、粉色、靛蓝中选一个）
描述：一句话描述
核心特质：
- xxx
- xxx
沟通风格：xxx
擅长领域：xxx, xxx, xxx
背景故事：xxx
开场白：xxx
回应长度：minimal/concise/moderate/detailed
禁忌：xxx, xxx
---END---

语气：温暖、好奇、有耐心。像一位创意搭档，而不是面试官。`;

@Injectable()
export class BuilderService {
  constructor(
    private llm: LlmService,
    private agents: AgentsService,
    private sessions: SessionsService,
  ) {}

  async chat(dto: BuilderChatDto) {
    // Save user message
    await this.sessions.addMessage(dto.sessionId, 'user', dto.content);

    // Get session history
    const session = await this.sessions.findOne(dto.sessionId);
    const history = session?.messages || [];

    // Build LLM messages
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: BUILDER_SYSTEM_PROMPT },
    ];

    for (const msg of history.slice(-30)) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'agent' || msg.role === 'builder') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    messages.push({ role: 'user', content: dto.content });

    // Call LLM
    const response = await this.llm.chat(messages, 800);
    if (!response.content) throw new Error('Empty LLM response');

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
    // Generate system prompt from the draft
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
        draft[key] = value;
      }
    }

    return draft;
  }

  private generateSystemPrompt(dto: ConfirmAgentDto): string {
    const traits = this.safeJsonParse(dto.coreTraits, []);
    const expertise = this.safeJsonParse(dto.expertise, []);
    const forbidden = this.safeJsonParse(dto.forbiddenTopics, []);

    const traitsText = Array.isArray(traits)
      ? traits.map((t: any) => `- ${t.key}：${t.value}`).join('\n')
      : '';

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
