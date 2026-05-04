import { AgentPersona, ChatMessage, Memory, MemoryMessage, AgentResponse, StreamChunk } from './types';
import { LLMProviderFactory } from './providers/factory';
import { MemoryFactory } from './memory/factory';
import { withRetry } from './retry/retry';
import { CircuitBreaker } from './retry/circuit-breaker';
import { globalEventBus } from './observability/event-bus';

export class Agent {
  readonly persona: AgentPersona;
  private memory: Memory;
  private provider: ReturnType<typeof LLMProviderFactory.create>;
  private circuitBreaker: CircuitBreaker;

  constructor(persona: AgentPersona) {
    this.persona = persona;
    this.provider = LLMProviderFactory.create(persona.provider);
    this.memory = MemoryFactory.create(persona.memory ?? { type: 'buffer', maxMessages: 20 });
    this.circuitBreaker = new CircuitBreaker();
  }

  async chat(userMessage: string, history?: ChatMessage[]): Promise<AgentResponse> {
    const start = Date.now();

    globalEventBus.emitQuick('chat:start', {
      agentId: this.persona.id,
      agentName: this.persona.name,
    });

    try {
      const messages = await this.buildMessages(userMessage, history);

      const content = await this.circuitBreaker.execute(() =>
        withRetry(
          () =>
            this.provider.chat(messages, {
              temperature: this.persona.temperature ?? 0.7,
              maxTokens: this.persona.maxTokens ?? 512,
              timeoutMs: 15000,
            }),
          { maxRetries: 2 },
        ),
      );

      await this.saveToMemory(userMessage, content);

      const latencyMs = Date.now() - start;

      globalEventBus.emitQuick('chat:end', {
        agentId: this.persona.id,
        agentName: this.persona.name,
        latencyMs,
      });

      globalEventBus.emitQuick('provider:success', {
        provider: this.provider.name,
      });

      return {
        content,
        agentId: this.persona.id,
        agentName: this.persona.name,
        latencyMs,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      globalEventBus.emitQuick('chat:error', {
        agentId: this.persona.id,
        agentName: this.persona.name,
        error,
      });
      globalEventBus.emitQuick('provider:error', {
        provider: this.provider.name,
        error,
      });
      throw err;
    }
  }

  async *streamChat(
    userMessage: string,
    history?: ChatMessage[],
  ): AsyncGenerator<StreamChunk> {
    globalEventBus.emitQuick('chat:start', {
      agentId: this.persona.id,
      agentName: this.persona.name,
    });

    const messages = await this.buildMessages(userMessage, history);
    const options = {
      temperature: this.persona.temperature ?? 0.7,
      maxTokens: this.persona.maxTokens ?? 512,
      timeoutMs: 15000,
    };

    let fullContent = '';

    try {
      for await (const chunk of this.provider.stream!(messages, options)) {
        if (!chunk.done) {
          fullContent += chunk.content;
        }
        globalEventBus.emitQuick('chat:stream', {
          agentId: this.persona.id,
          agentName: this.persona.name,
          content: chunk.content,
        });
        yield chunk;
      }

      await this.saveToMemory(userMessage, fullContent);

      globalEventBus.emitQuick('chat:end', {
        agentId: this.persona.id,
        agentName: this.persona.name,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      globalEventBus.emitQuick('chat:error', {
        agentId: this.persona.id,
        agentName: this.persona.name,
        error,
      });
      throw err;
    }
  }

  async chatWithContext(contextMessages: ChatMessage[], userMessage: string): Promise<AgentResponse> {
    const start = Date.now();

    globalEventBus.emitQuick('chat:start', {
      agentId: this.persona.id,
      agentName: this.persona.name,
    });

    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: this.persona.systemPrompt },
        ...contextMessages,
        { role: 'user', content: userMessage },
      ];

      const content = await this.circuitBreaker.execute(() =>
        withRetry(
          () =>
            this.provider.chat(messages, {
              temperature: this.persona.temperature ?? 0.7,
              maxTokens: this.persona.maxTokens ?? 512,
              timeoutMs: 15000,
            }),
          { maxRetries: 2 },
        ),
      );

      const latencyMs = Date.now() - start;

      globalEventBus.emitQuick('chat:end', {
        agentId: this.persona.id,
        agentName: this.persona.name,
        latencyMs,
      });

      return {
        content,
        agentId: this.persona.id,
        agentName: this.persona.name,
        latencyMs,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      globalEventBus.emitQuick('chat:error', {
        agentId: this.persona.id,
        agentName: this.persona.name,
        error,
      });
      throw err;
    }
  }

  async clearMemory(): Promise<void> {
    await this.memory.clear();
  }

  getMemorySnapshot(): Promise<MemoryMessage[]> {
    return this.memory.get();
  }

  getCircuitState(): string {
    return this.circuitBreaker.getState();
  }

  private async buildMessages(userMessage: string, history?: ChatMessage[]): Promise<ChatMessage[]> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.persona.systemPrompt },
    ];

    if (!history || history.length === 0) {
      const memMessages = await this.memory.get(20);
      for (const m of memMessages) {
        messages.push({ role: m.role, content: m.content });
      }
    } else {
      messages.push(...history);
    }

    messages.push({ role: 'user', content: userMessage });
    return messages;
  }

  private async saveToMemory(userMessage: string, assistantContent: string): Promise<void> {
    await this.memory.add({ role: 'user', content: userMessage, timestamp: new Date() });
    await this.memory.add({ role: 'assistant', content: assistantContent, timestamp: new Date() });
  }
}
