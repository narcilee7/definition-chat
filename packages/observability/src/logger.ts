/**
 * OhMe Logger Interface
 *
 * 通用日志抽象，供 Agent Framework 和 API Server 复用。
 * 上层（如 API Server）可注入具体实现（如 Pino、Winston）。
 */
export interface Logger {
  /** 记录普通信息日志 */
  info(message: string, meta?: Record<string, unknown>): void;
  /** 记录警告日志 */
  warn(message: string, meta?: Record<string, unknown>): void;
  /** 记录错误日志 */
  error(message: string, meta?: Record<string, unknown>): void;
  /** 记录调试日志 */
  debug(message: string, meta?: Record<string, unknown>): void;
}

/** 日志级别 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** 默认的 ConsoleLogger，作为 fallback 使用 */
export class ConsoleLogger implements Logger {
  constructor(private readonly context?: string) {}

  private prefix(): string {
    return this.context ? `[${this.context}]` : '';
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`${this.prefix()} [INFO] ${message}`, meta ?? '');
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`${this.prefix()} [WARN] ${message}`, meta ?? '');
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`${this.prefix()} [ERROR] ${message}`, meta ?? '');
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`${this.prefix()} [DEBUG] ${message}`, meta ?? '');
    }
  }
}

let _globalLogger: Logger = new ConsoleLogger('OhMe');

/** 设置全局 Logger 实例 */
export function setGlobalLogger(logger: Logger): void {
  _globalLogger = logger;
}

/** 获取当前全局 Logger 实例 */
export function getGlobalLogger(): Logger {
  return _globalLogger;
}

/** 创建一个带上下文的子 Logger（基于当前全局 Logger） */
export function createLogger(context: string): Logger {
  const parent = getGlobalLogger();
  return {
    info: (msg: string, meta?) => parent.info(msg, { context, ...meta }),
    warn: (msg: string, meta?) => parent.warn(msg, { context, ...meta }),
    error: (msg: string, meta?) => parent.error(msg, { context, ...meta }),
    debug: (msg: string, meta?) => parent.debug(msg, { context, ...meta }),
  };
}
