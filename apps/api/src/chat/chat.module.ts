import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SharedModule } from '../shared/shared.module';
import { AgentsModule } from '../agents/agents.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SharedModule, AgentsModule, SessionsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
