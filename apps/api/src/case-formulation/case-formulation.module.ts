import { Module } from '@nestjs/common';
import { CaseFormulationService } from './case-formulation.service';
import { CaseFormulationController } from './case-formulation.controller';

@Module({
  providers: [CaseFormulationService],
  controllers: [CaseFormulationController],
  exports: [CaseFormulationService],
})
export class CaseFormulationModule {}
