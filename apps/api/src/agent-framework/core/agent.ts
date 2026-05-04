import { AgentPersona, ChatMessage, Memory, MemoryMessage, AgentResponse } from './types';
import { LLMProviderFactory } from '../providers/factory';
import { MemoryFactory } from '../memory/factory';

export class Agent {
  readonly persona: AgentPersona;
  private memory: Memory;
  private provider: ReturnType<typeof LLMProviderFactory.create>;

  constructor(persona: AgentPersona) {
    this.persona = persona;
    this.provider = LLMProviderFactory.create(persona.provider);
    this.memory = MemoryFactory.create(persona.memory ?? { type: 'buffer', maxMessages: 20 });
  }

  async chat(userMessage: string, history?: ChatMessage[]): Promise<AgentResponse> {
    const start = Date.now();

    // Build messages
    const messages: ChatMessage[] = [
      { role: 'system', content: this.persona.systemPrompt },
    ];

    // Add memory context if no explicit history provided
    if (!history || history.length === 0) {
      const memMessages = await this.memory.get(20);
      for (const m of memMessages) {
        messages.push({ role: m.role, content: m.content });
      }
    } else {
      for (const h of history) {
        messages.push(h);
      }
    }

    messages.push({ role: 'user', content: userMessage });

    // Call LLM
    const content = await this.provider.chat(messages, {
      temperature: this.persona.temperature ?? 0.7,
      maxTokens: this.persona.maxTokens ?? 512,
      timeoutMs: 15000,
    });

    // Save to memory
    await this.memory.add({ role: 'user', content: userMessage, timestamp: new Date() });
    await this.memory.add({ role: 'assistant', content, timestamp: new Date() });

    return {
      content,
      agentId: this.persona.id,
      agentName: this.persona.name,
      latencyMs: Date.now() - start,
    };
  }

  async chatWithContext(contextMessages: ChatMessage[], userMessage: string): Promise<AgentResponse> {
    const start = Date.now();

    const messages: ChatMessage[] = [
      { role: 'system', content: this.persona.systemPrompt },
      ...contextMessages,
      { role: 'user', content: userMessage },
    ];

    const content = await this.provider.chat(messages, {
      temperature: this.persona.temperature ?? 0.7,
      maxTokens: this.persona.maxTokens ?? 512,
      timeoutMs: 15000,
    });

    return {
      content,
      agentId: this.persona.id,
      agentName: this.persona.name,
      latencyMs: Date.now() - start,
    };
  }

  async clearMemory(): Promise<void> {
    await this.memory.clear();
  }

  getMemorySnapshot(): Promise<MemoryMessage[]> {
    return this.memory.get();
  }
}
