import { Module } from '@nestjs/common';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { AgentsModule } from '../agents/agents.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [AgentsModule, SessionsModule],
  controllers: [BuilderController],
  providers: [BuilderService],
})
export class BuilderModule {}
