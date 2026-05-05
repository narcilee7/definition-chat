import { Module } from '@nestjs/common';
import { RiskDetectorService } from './risk-detector.service';
import { CrisisInterventionService } from './crisis-intervention.service';

@Module({
  providers: [RiskDetectorService, CrisisInterventionService],
  exports: [RiskDetectorService, CrisisInterventionService],
})
export class RiskModule {}
