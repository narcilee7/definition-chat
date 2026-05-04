// ============================================================
// OhMe Agent Framework — Event Bus (Observability)
// ============================================================

export interface AgentEvent {
  type:
    | 'chat:start'
    | 'chat:end'
    | 'chat:error'
    | 'chat:stream'
    | 'provider:call'
    | 'provider:success'
    | 'provider:error'
    | 'provider:circuit-open'
    | 'memory:read'
    | 'memory:write'
    | 'registry:register'
    | 'registry:remove';
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
  private handlers = new Map<string, Set<EventHandler>>();
  private wildcardHandlers = new Set<EventHandler>();

  on(eventType: string, handler: EventHandler): () => void {
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

  off(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  emit(event: AgentEvent): void {
    // Specific handlers
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

    // Wildcard handlers
    for (const h of this.wildcardHandlers) {
      try {
        h(event);
      } catch (err) {
        console.error(`[EventBus] Wildcard handler error:`, err);
      }
    }
  }

  emitQuick(type: AgentEvent['type'], payload?: Partial<Omit<AgentEvent, 'type' | 'timestamp'>>): void {
    this.emit({
      type,
      timestamp: Date.now(),
      ...payload,
    });
  }
}

// Singleton
export const globalEventBus = new EventBus();
