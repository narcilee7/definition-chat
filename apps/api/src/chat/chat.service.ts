import { Injectable } from '@nestjs/common';
import { globalRegistry, parallelExecute, Agent } from '@ohme/agent-framework';
import { SessionsService } from '../sessions/sessions.service';
import { ChatDto, MultiChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private sessions: SessionsService) {}

  async chat(dto: ChatDto) {
    const agent = globalRegistry.getAgent(dto.agentId);

    // Save user message
    await this.sessions.addMessage(dto.sessionId, 'user', dto.content);

    // Get history for context (but not from memory since Agent handles its own)
    const session = await this.sessions.findOne(dto.sessionId);
    const history = (session?.messages || [])
      .filter((m: any) => m.role === 'user' || m.role === 'agent')
      .slice(-10)
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Chat through Agent Framework
    const response = await agent.chatWithContext(history, dto.content);

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

    // Get agents
    const agents: Agent[] = [];
    for (const id of dto.agentIds) {
      try {
        agents.push(globalRegistry.getAgent(id));
      } catch {
        // Agent not found, skip
      }
    }

    // Get shared history
    const session = await this.sessions.findOne(dto.sessionId);
    const history = (session?.messages || [])
      .filter((m: any) => m.role === 'user' || m.role === 'agent')
      .slice(-10)
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Parallel execution through Orchestrator
    const results = await parallelExecute(
      agents,
      `[多Agent模式] ${dto.content}`,
      history
    );

    // Save all responses
    const messages = [];
    for (const res of results) {
      const msg = await this.sessions.addMessage(
        dto.sessionId,
        'agent',
        res.content,
        res.agentId,
      );
      messages.push(msg);
    }

    return { messages };
  }
}
