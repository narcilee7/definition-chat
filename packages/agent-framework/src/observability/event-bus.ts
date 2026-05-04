import { EventType } from '../types';

export interface AgentEvent {
  type: EventType;
  agentId?: string;
  agentName?: string;
  provider?: string;
  latencyMs?: number;
  error?: string;
  content?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type EventHandler = (event: AgentEvent) => void;

export class EventBus {
  private handlers = new Map<EventType, Set<EventHandler>>();
  private wildcardHandlers = new Set<EventHandler>();

  on(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => this.off(eventType, handler);
  }

  onAny(handler: EventHandler): () => void {
    this.wildcardHandlers.add(handler);
    return () => this.wildcardHandlers.delete(handler);
  }

  off(eventType: EventType, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  emit(event: AgentEvent): void {
    const specific = this.handlers.get(event.type);
    if (specific) {
      for (const h of specific) {
        try {
          h(event);
        } catch (err) {
          console.error(`[EventBus] Handler error for ${event.type}:`, err);
        }
      }
    }

    for (const h of this.wildcardHandlers) {
      try {
        h(event);
      } catch (err) {
        console.error(`[EventBus] Wildcard handler error:`, err);
      }
    }
  }

  emitQuick(type: EventType, payload?: Partial<Omit<AgentEvent, 'type' | 'timestamp'>>): void {
    this.emit({
      type,
      timestamp: Date.now(),
      ...payload,
    });
  }
}

export const globalEventBus = new EventBus();
