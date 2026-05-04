import { AgentPersona, ChatMessage, Memory, MemoryMessage, AgentResponse, StreamChunk } from './types';
import { LLMProviderFactory } from './providers/factory';
import { MemoryFactory } from './memory/factory';
import { withRetry } from './retry/retry';
import { CircuitBreaker } from './retry/circuit-breaker';
import { globalEventBus } from './observability/event-bus';
import { ToolRegistry } from './tools/registry';
import { ToolExecutor } from './tools/executor';
import { Tool } from './tools/types';
import { AgentStateMachine } from './state/state-machine';
import { AgentLifecycle } from './state/lifecycle';

export class Agent {
  readonly persona: AgentPersona;
  private memory: Memory;
  private provider: ReturnType<typeof LLMProviderFactory.create>;
  private circuitBreaker: CircuitBreaker;
  private toolRegistry: ToolRegistry;
  private toolExecutor: ToolExecutor;
  private _stateMachine: AgentStateMachine;
  private _lifecycle: AgentLifecycle;
  private maxToolRounds = 3;

  constructor(persona: AgentPersona, tools?: Tool[]) {
    this.persona = persona;
    this.provider = LLMProviderFactory.create(persona.provider);
    this.memory = MemoryFactory.create(persona.memory ?? { type: 'buffer', maxMessages: 20 });
    this.circuitBreaker = new CircuitBreaker();
    this.toolRegistry = new ToolRegistry();
    this.toolExecutor = new ToolExecutor(this.toolRegistry);
    this._stateMachine = new AgentStateMachine();
    this._lifecycle = new AgentLifecycle();

    if (tools) {
      this.toolRegistry.registerMany(tools);
    }
  }

  get stateMachine(): AgentStateMachine {
    return this._stateMachine;
  }

  get lifecycle(): AgentLifecycle {
    return this._lifecycle;
  }

  addTool(tool: Tool): void {
    this.toolRegistry.register(tool);
  }

  addTools(tools: Tool[]): void {
    this.toolRegistry.registerMany(tools);
  }

  async chat(userMessage: string, history?: ChatMessage[]): Promise<AgentResponse> {
    const start = Date.now();
    this._stateMachine.transition('thinking', 'chat');
    await this._lifecycle.beforeChat(userMessage);

    globalEventBus.emitQuick('chat:start', {
      agentId: this.persona.id,
      agentName: this.persona.name,
    });

    try {
      const messages = await this.buildMessages(userMessage, history);
      const tools = this.toolRegistry.list();

      let finalContent = '';
      let toolRound = 0;

      // Tool calling loop (max 3 rounds)
      while (toolRound < this.maxToolRounds) {
        const { content, toolCalls } = await this.circuitBreaker.execute(() =>
          withRetry(
            () => this.provider.chat(messages, {
              temperature: this.persona.temperature ?? 0.7,
              maxTokens: this.persona.maxTokens ?? 512,
              timeoutMs: 15000,
            }, tools.length > 0 ? tools : undefined),
            { maxRetries: 2 },
          ),
        );

        if (!toolCalls || toolCalls.length === 0) {
          finalContent = content;
          break;
        }

        // Execute tools
        this._stateMachine.transition('calling_tool', 'tool_call');
        const parsedCalls = toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: JSON.parse(tc.arguments) as Record<string, unknown>,
        }));

        const results = await this.toolExecutor.execute(parsedCalls);

        // Add tool results to messages for next LLM call
        messages.push({
          role: 'assistant',
          content: content || null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: tc.arguments },
          })),
        } as ChatMessage);

        for (const result of results) {
          messages.push({
            role: 'tool',
            content: result.error || result.result,
            tool_call_id: result.toolCallId,
          } as ChatMessage);
        }

        toolRound++;
      }

      await this.saveToMemory(userMessage, finalContent);
      const latencyMs = Date.now() - start;

      this._stateMachine.transition('idle', 'chat_complete');
      await this._lifecycle.afterChat(userMessage, finalContent);

      globalEventBus.emitQuick('chat:end', {
        agentId: this.persona.id,
        agentName: this.persona.name,
        latencyMs,
      });
      globalEventBus.emitQuick('provider:success', { provider: this.provider.name });

      return {
        content: finalContent,
        agentId: this.persona.id,
        agentName: this.persona.name,
        latencyMs,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this._stateMachine.transition('error', 'chat_error');
      await this._lifecycle.onError(err instanceof Error ? err : new Error(error));

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
    this._stateMachine.transition('streaming', 'stream');
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
      this._stateMachine.transition('idle', 'stream_complete');

      globalEventBus.emitQuick('chat:end', {
        agentId: this.persona.id,
        agentName: this.persona.name,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this._stateMachine.transition('error', 'stream_error');
      await this._lifecycle.onError(err instanceof Error ? err : new Error(error));
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
    this._stateMachine.transition('thinking', 'chat_context');

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

      const { content } = await this.circuitBreaker.execute(() =>
        withRetry(
          () => this.provider.chat(messages, {
            temperature: this.persona.temperature ?? 0.7,
            maxTokens: this.persona.maxTokens ?? 512,
            timeoutMs: 15000,
          }),
          { maxRetries: 2 },
        ),
      );

      const latencyMs = Date.now() - start;
      this._stateMachine.transition('idle', 'chat_context_complete');

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
      this._stateMachine.transition('error', 'chat_context_error');
      await this._lifecycle.onError(err instanceof Error ? err : new Error(error));
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
