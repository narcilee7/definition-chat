import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionManagerService } from '../therapy/session-manager.service';

@Module({
  providers: [SessionsService, SessionManagerService],
  controllers: [SessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}
