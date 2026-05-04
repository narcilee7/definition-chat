import { Module } from '@nestjs/common';
import { LoggerModule as NestLoggerModule } from 'nestjs-pino';
import { LoggerBridgeService } from './logger-bridge.service';

const isDev = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    NestLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        // 脱敏：移除请求头中的敏感信息
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          remove: true,
        },
        transport: isDev
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                ignore: 'pid,hostname',
                singleLine: false,
              },
            }
          : undefined,
      },
    }),
  ],
  providers: [LoggerBridgeService],
})
export class OhmeLoggerModule {}
