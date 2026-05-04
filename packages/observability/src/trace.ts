/**
 * OhMe Trace Context
 *
 * 提供跨异步调用的 traceId / spanId 传播能力。
 * 上层可结合 AsyncLocalStorage 实现请求级链路追踪。
 */
export interface TraceContext {
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
}

let _traceProvider: (() => TraceContext | undefined) | undefined;

/** 设置全局 Trace 上下文提供者 */
export function setTraceProvider(provider: () => TraceContext | undefined): void {
  _traceProvider = provider;
}

/** 获取当前 Trace 上下文 */
export function getTraceContext(): TraceContext | undefined {
  return _traceProvider?.();
}

/** 生成一个随机 traceId */
export function generateTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
