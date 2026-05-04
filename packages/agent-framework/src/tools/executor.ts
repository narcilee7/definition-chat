import { ToolRegistry } from './registry';
import { ToolCall, ToolResult } from './types';
import { globalEventBus } from '../observability/event-bus';

export class ToolExecutor {
  private registry: ToolRegistry;

  constructor(registry?: ToolRegistry) {
    this.registry = registry || new ToolRegistry();
  }

  async execute(calls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of calls) {
      const tool = this.registry.get(call.name);
      if (!tool) {
        results.push({
          toolCallId: call.id,
          name: call.name,
          result: '',
          error: `Tool not found: ${call.name}`,
        });
        continue;
      }

      globalEventBus.emitQuick('tool:call', {
        metadata: { toolName: call.name, arguments: call.arguments },
      });

      const start = Date.now();
      try {
        const result = await Promise.resolve(tool.execute(call.arguments));
        const latency = Date.now() - start;

        globalEventBus.emitQuick('tool:success', {
          metadata: { toolName: call.name, latencyMs: latency },
        });

        results.push({
          toolCallId: call.id,
          name: call.name,
          result: String(result),
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        globalEventBus.emitQuick('tool:error', {
          error,
          metadata: { toolName: call.name },
        });

        results.push({
          toolCallId: call.id,
          name: call.name,
          result: '',
          error,
        });
      }
    }

    return results;
  }
}
