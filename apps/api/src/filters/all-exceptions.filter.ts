import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * 全局异常过滤器
 *
 * - 统一捕获所有未处理异常
 * - 自动记录错误日志（含堆栈、请求路径、状态码）
 * - 返回标准化错误响应，避免泄露内部信息
 */
@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // 仅在生产环境隐藏详细错误信息
    const isProd = process.env.NODE_ENV === 'production';
    const responseMessage = isProd && status === 500 ? 'Internal server error' : message;

    this.logger.error(
      {
        err:
          exception instanceof Error
            ? { message: exception.message, stack: exception.stack }
            : exception,
        req: {
          method: request.method,
          url: request.url,
          ip: request.ip,
          traceId: request.id,
        },
        res: { statusCode: status },
      },
      `${request.method} ${request.url} → ${status}: ${message}`,
    );

    response.status(status).json({
      statusCode: status,
      message: responseMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
