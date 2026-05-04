import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { setGlobalLogger } from '@ohme/observability';
import { PinoObservabilityLogger } from './pino-observability-logger';

/**
 * LoggerBridgeService
 *
 * 在 NestJS 应用启动时，将 nestjs-pino 的实例注入到 @ohme/observability 全局。
 * 这样 agent-framework 和其他共享包就能自动使用同一套 Pino 日志输出。
 */
@Injectable()
export class LoggerBridgeService implements OnModuleInit {
  constructor(
    @InjectPinoLogger() private readonly pino: PinoLogger,
  ) {}

  onModuleInit(): void {
    setGlobalLogger(new PinoObservabilityLogger(this.pino));
  }
}
