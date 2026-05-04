import { AgentEvent } from './event-bus';

export interface MetricsSnapshot {
  totalChats: number;
  totalErrors: number;
  avgLatencyMs: number;
  providerCalls: Record<string, number>;
  providerErrors: Record<string, number>;
  agentCalls: Record<string, number>;
}

/**
 * Simple in-memory metrics collector
 * Attach to EventBus to collect runtime metrics
 */
export class MetricsCollector {
  private stats = {
    totalChats: 0,
    totalErrors: 0,
    latencies: [] as number[],
    providerCalls: new Map<string, number>(),
    providerErrors: new Map<string, number>(),
    agentCalls: new Map<string, number>(),
  };

  handle(event: AgentEvent): void {
    switch (event.type) {
      case 'chat:end':
        this.stats.totalChats++;
        if (event.latencyMs) {
          this.stats.latencies.push(event.latencyMs);
          // Keep last 1000
          if (this.stats.latencies.length > 1000) {
            this.stats.latencies = this.stats.latencies.slice(-1000);
          }
        }
        if (event.agentId) {
          const count = this.stats.agentCalls.get(event.agentId) || 0;
          this.stats.agentCalls.set(event.agentId, count + 1);
        }
        break;

      case 'chat:error':
        this.stats.totalErrors++;
        break;

      case 'provider:success':
        if (event.provider) {
          const count = this.stats.providerCalls.get(event.provider) || 0;
          this.stats.providerCalls.set(event.provider, count + 1);
        }
        break;

      case 'provider:error':
        if (event.provider) {
          const count = this.stats.providerErrors.get(event.provider) || 0;
          this.stats.providerErrors.set(event.provider, count + 1);
        }
        break;
    }
  }

  snapshot(): MetricsSnapshot {
    const latencies = this.stats.latencies;
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    return {
      totalChats: this.stats.totalChats,
      totalErrors: this.stats.totalErrors,
      avgLatencyMs: Math.round(avgLatency),
      providerCalls: Object.fromEntries(this.stats.providerCalls),
      providerErrors: Object.fromEntries(this.stats.providerErrors),
      agentCalls: Object.fromEntries(this.stats.agentCalls),
    };
  }

  reset(): void {
    this.stats = {
      totalChats: 0,
      totalErrors: 0,
      latencies: [],
      providerCalls: new Map(),
      providerErrors: new Map(),
      agentCalls: new Map(),
    };
  }
}
