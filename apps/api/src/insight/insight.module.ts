import { Module } from '@nestjs/common';
import { InsightEngine } from './insight.engine';
import { InsightController } from './insight.controller';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [LLMModule],
  controllers: [InsightController],
  providers: [InsightEngine],
  exports: [InsightEngine],
})
export class InsightModule {}
