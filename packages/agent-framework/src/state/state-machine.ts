// ============================================================
// OhMe Agent Framework — Agent State Machine
// ============================================================

export type AgentState =
  | 'idle'       // 等待输入
  | 'thinking'   // 正在处理
  | 'calling_tool' // 正在调用工具
  | 'streaming'  // 正在流式输出
  | 'error'      // 发生错误
  | 'paused';    // 暂停（如等待用户确认）

export interface StateTransition {
  from: AgentState;
  to: AgentState;
  trigger?: string;
  timestamp: number;
}

export type StateChangeHandler = (from: AgentState, to: AgentState, trigger?: string) => void;

/**
 * AgentStateMachine — 管理 Agent 的生命周期状态
 */
export class AgentStateMachine {
  private state: AgentState = 'idle';
  private history: StateTransition[] = [];
  private handlers = new Set<StateChangeHandler>();

  get current(): AgentState {
    return this.state;
  }

  get isBusy(): boolean {
    return this.state === 'thinking' || this.state === 'calling_tool' || this.state === 'streaming';
  }

  transition(to: AgentState, trigger?: string): void {
    const from = this.state;
    if (from === to) return;

    this.state = to;
    const transition: StateTransition = { from, to, trigger, timestamp: Date.now() };
    this.history.push(transition);

    // Keep last 100 transitions
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }

    for (const h of this.handlers) {
      try {
        h(from, to, trigger);
      } catch {
        // ignore handler errors
      }
    }
  }

  onChange(handler: StateChangeHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  getHistory(): StateTransition[] {
    return [...this.history];
  }

  reset(): void {
    this.state = 'idle';
    this.history = [];
  }
}
