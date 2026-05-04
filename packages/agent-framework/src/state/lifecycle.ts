import { AgentStateMachine } from './state-machine';
import { globalEventBus } from '../observability/event-bus';
import { EventType } from '../types';

export interface LifecycleHooks {
  onInit?: () => void | Promise<void>;
  onBeforeChat?: (message: string) => void | Promise<void>;
  onAfterChat?: (message: string, response: string) => void | Promise<void>;
  onToolCall?: (toolName: string, params: Record<string, unknown>) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;
}

export class AgentLifecycle {
  stateMachine = new AgentStateMachine();
  private hooks: LifecycleHooks = {};

  setHooks(hooks: LifecycleHooks): void {
    this.hooks = hooks;
  }

  async init(): Promise<void> {
    this.stateMachine.transition(this.stateMachine.current, 'init');
    globalEventBus.emitQuick(EventType.AgentInit);
    await this.callHook('onInit');
  }

  async beforeChat(message: string): Promise<void> {
    await this.callHook('onBeforeChat', message);
  }

  async afterChat(message: string, response: string): Promise<void> {
    await this.callHook('onAfterChat', message, response);
  }

  async onToolCall(toolName: string, params: Record<string, unknown>): Promise<void> {
    globalEventBus.emitQuick(EventType.ToolCall, {
      metadata: { toolName, params },
    });
    await this.callHook('onToolCall', toolName, params);
  }

  async onError(error: Error): Promise<void> {
    globalEventBus.emitQuick(EventType.AgentError, { error: error.message });
    await this.callHook('onError', error);
    setTimeout(() => this.stateMachine.transition(this.stateMachine.current, 'recover'), 100);
  }

  async destroy(): Promise<void> {
    await this.callHook('onDestroy');
    globalEventBus.emitQuick(EventType.AgentDestroy);
  }

  private async callHook<K extends keyof LifecycleHooks>(
    name: K,
    ...args: Parameters<NonNullable<LifecycleHooks[K]>>
  ): Promise<void> {
    const hook = this.hooks[name] as (...args: unknown[]) => void | Promise<void>;
    if (hook) {
      try {
        await hook(...args);
      } catch (err) {
        console.error(`[Lifecycle] Hook ${name} failed:`, err);
      }
    }
  }
}
