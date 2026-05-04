import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { ChatModule } from './chat/chat.module';
import { SessionsModule } from './sessions/sessions.module';
import { BuilderModule } from './builder/builder.module';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { AgentLoaderService } from './agent-framework/agent-loader.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SharedModule,
    AgentsModule,
    SessionsModule,
    ChatModule,
    BuilderModule,
  ],
  providers: [AgentLoaderService],
})
export class AppModule {}
