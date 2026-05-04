import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { ChatModule } from './chat/chat.module';
import { SessionsModule } from './sessions/sessions.module';
import { BuilderModule } from './builder/builder.module';
import { PrismaModule } from './prisma/prisma.module';
import { AgentLoaderService } from './agent-loader.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AgentsModule,
    SessionsModule,
    ChatModule,
    BuilderModule,
  ],
  providers: [AgentLoaderService],
})
export class AppModule {}
