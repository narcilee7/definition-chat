import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OhmeLoggerModule } from './logger/logger.module';
import { AgentsModule } from './agents/agents.module';
import { ChatModule } from './chat/chat.module';
import { SessionsModule } from './sessions/sessions.module';
import { BuilderModule } from './builder/builder.module';
import { PrismaModule } from './prisma/prisma.module';
import { InsightModule } from './insight/insight.module';
import { AgentLoaderService } from './agent-loader.service';
import { LLMFallbackService } from './llm/llm-fallback.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    OhmeLoggerModule,
    PrismaModule,
    AgentsModule,
    SessionsModule,
    ChatModule,
    BuilderModule,
    InsightModule,
  ],
  providers: [AgentLoaderService, LLMFallbackService],
})
export class AppModule {}
