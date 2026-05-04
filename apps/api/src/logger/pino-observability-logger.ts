import { Logger } from '@ohme/observability';
import { PinoLogger } from 'nestjs-pino';

/**
 * 将 nestjs-pino 的 PinoLogger 适配为 @ohme/observability 的 Logger 接口。
 *
 * 这样 Agent Framework 和 API Server 可以共用同一套日志抽象，
 * 而底层实现由 API Server 注入。
 */
export class PinoObservabilityLogger implements Logger {
  constructor(private readonly pino: PinoLogger) {}

  info(message: string, meta?: Record<string, unknown>): void {
    this.pino.info(meta ?? {}, message);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.pino.warn(meta ?? {}, message);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.pino.error(meta ?? {}, message);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.pino.debug(meta ?? {}, message);
  }
}
