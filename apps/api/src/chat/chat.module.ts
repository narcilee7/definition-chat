import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SessionsModule } from '../sessions/sessions.module';
import { InsightModule } from '../insight/insight.module';

@Module({
  imports: [SessionsModule, InsightModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
