import { Module } from '@nestjs/common';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { SharedModule } from '../shared/shared.module';
import { AgentsModule } from '../agents/agents.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [SharedModule, AgentsModule, SessionsModule],
  controllers: [BuilderController],
  providers: [BuilderService],
})
export class BuilderModule {}
