import { Module } from '@nestjs/common';
import { LLMModule } from '../llm/llm.module';
import { RefractionService } from './refraction.service';
import { RefractionController } from './refraction.controller';

@Module({
  imports: [LLMModule],
  providers: [RefractionService],
  controllers: [RefractionController],
})
export class RefractionModule {}
