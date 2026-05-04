import { Injectable } from '@nestjs/common';
import { LlmService } from '../shared/llm.service';
import { AgentsService } from '../agents/agents.service';
import { SessionsService } from '../sessions/sessions.service';
import { ChatDto, MultiChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private llm: LlmService,
    private agents: AgentsService,
    private sessions: SessionsService,
  ) {}

  async chat(dto: ChatDto) {
    const agent = await this.agents.findOne(dto.agentId);
    if (!agent) throw new Error('Agent not found');

    // Save user message
    await this.sessions.addMessage(dto.sessionId, 'user', dto.content);

    // Get session history
    const session = await this.sessions.findOne(dto.sessionId);
    const history = session?.messages || [];

    // Build LLM messages
    const llmMessages = this.buildLlmMessages(agent.systemPrompt, history);
    llmMessages.push({ role: 'user' as const, content: dto.content });

    // Call LLM
    const response = await this.llm.chat(llmMessages);
    if (!response.content) throw new Error('Empty LLM response');

    // Save agent message
    const message = await this.sessions.addMessage(
      dto.sessionId,
      'agent',
      response.content,
      dto.agentId,
    );

    return { message };
  }

  async multiChat(dto: MultiChatDto) {
    // Save user message once
    await this.sessions.addMessage(dto.sessionId, 'user', dto.content);

    // Get session history
    const session = await this.sessions.findOne(dto.sessionId);
    const history = session?.messages || [];

    // Parallel calls for each agent
    const promises = dto.agentIds.map(async (agentId) => {
      try {
        const agent = await this.agents.findOne(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found`);

        const llmMessages = this.buildLlmMessages(agent.systemPrompt, history);
        llmMessages.push({
          role: 'user' as const,
          content: `[多Agent模式] 用户的问题：${dto.content}`,
        });

        const response = await this.llm.chat(llmMessages, 400);

        const message = await this.sessions.addMessage(
          dto.sessionId,
          'agent',
          response.content,
          agentId,
        );
        return message;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Agent failed to respond';
        const message = await this.sessions.addMessage(
          dto.sessionId,
          'agent',
          `[${agentId}] ${errorMsg}`,
          agentId,
        );
        return message;
      }
    });

    const messages = await Promise.all(promises);
    return { messages };
  }

  private buildLlmMessages(systemPrompt: string, history: any[]) {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of history.slice(-20)) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'agent') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    return messages;
  }
}
