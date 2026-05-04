import { Module } from '@nestjs/common';
import { LLMFallbackService } from './llm-fallback.service';

@Module({
  providers: [LLMFallbackService],
  exports: [LLMFallbackService],
})
export class LLMModule {}
