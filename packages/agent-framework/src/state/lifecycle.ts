import { AgentStateMachine } from './state-machine';
import { globalEventBus } from '../observability/event-bus';

/**
 * LifecycleHooks — Agent 生命周期钩子
 */
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
    this.stateMachine.transition('idle', 'init');
    globalEventBus.emitQuick('agent:init');
    await this.callHook('onInit');
  }

  async beforeChat(message: string): Promise<void> {
    this.stateMachine.transition('thinking', 'before_chat');
    await this.callHook('onBeforeChat', message);
  }

  async afterChat(message: string, response: string): Promise<void> {
    this.stateMachine.transition('idle', 'after_chat');
    await this.callHook('onAfterChat', message, response);
  }

  async onToolCall(toolName: string, params: Record<string, unknown>): Promise<void> {
    this.stateMachine.transition('calling_tool', 'tool_call');
    globalEventBus.emitQuick('tool:call', {
      metadata: { toolName, params },
    });
    await this.callHook('onToolCall', toolName, params);
  }

  async onError(error: Error): Promise<void> {
    this.stateMachine.transition('error', 'error');
    globalEventBus.emitQuick('agent:error', { error: error.message });
    await this.callHook('onError', error);
    // Auto recover to idle after error
    setTimeout(() => this.stateMachine.transition('idle', 'recover'), 100);
  }

  async destroy(): Promise<void> {
    await this.callHook('onDestroy');
    globalEventBus.emitQuick('agent:destroy');
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
