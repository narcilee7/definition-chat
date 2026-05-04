import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger as PinoNestLogger, LoggerErrorInterceptor, PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // 使用 Pino 替代 NestJS 默认 Logger
  app.useLogger(app.get(PinoNestLogger));
  app.flushLogs();

  // 全局异常过滤器
  const pinoLogger = await app.resolve(PinoLogger);
  app.useGlobalFilters(new AllExceptionsFilter(pinoLogger));

  // 自动将 Error 对象序列化到日志
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);

  app.get(PinoNestLogger).log(`OhMe API running on port ${port}`);
}

bootstrap();
