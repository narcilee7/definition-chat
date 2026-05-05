import { Module } from '@nestjs/common';
import { LLMModule } from '../llm/llm.module';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';

@Module({
  imports: [LLMModule],
  controllers: [ExploreController],
  providers: [ExploreService],
})
export class ExploreModule {}
