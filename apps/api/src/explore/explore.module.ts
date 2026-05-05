import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';
import { ExplorationController } from './exploration.controller';
import { ExplorationService } from './exploration.service';

@Module({
  imports: [PrismaModule, LLMModule],
  controllers: [ExplorationController],
  providers: [ExplorationService],
  exports: [ExplorationService],
})
export class ExploreModule {}
