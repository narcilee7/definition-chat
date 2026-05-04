import { AgentState } from '../types';

export interface StateTransition {
  from: AgentState;
  to: AgentState;
  trigger?: string;
  timestamp: number;
}

export type StateChangeHandler = (from: AgentState, to: AgentState, trigger?: string) => void;

export class AgentStateMachine {
  private state: AgentState = AgentState.Idle;
  private history: StateTransition[] = [];
  private handlers = new Set<StateChangeHandler>();

  get current(): AgentState {
    return this.state;
  }

  get isBusy(): boolean {
    return (
      this.state === AgentState.Thinking ||
      this.state === AgentState.CallingTool ||
      this.state === AgentState.Streaming
    );
  }

  transition(to: AgentState, trigger?: string): void {
    const from = this.state;
    if (from === to) return;

    this.state = to;
    const transition: StateTransition = { from, to, trigger, timestamp: Date.now() };
    this.history.push(transition);

    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }

    for (const h of this.handlers) {
      try {
        h(from, to, trigger);
      } catch {
        // ignore
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
    this.state = AgentState.Idle;
    this.history = [];
  }
}
