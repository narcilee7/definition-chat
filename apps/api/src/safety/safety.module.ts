import { Module } from '@nestjs/common';
import { SafetyPlanService } from './safety-plan.service';
import { SafetyController } from './safety.controller';

@Module({
  providers: [SafetyPlanService],
  controllers: [SafetyController],
  exports: [SafetyPlanService],
})
export class SafetyModule {}
