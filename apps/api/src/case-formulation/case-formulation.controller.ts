import { Controller, Get, Param } from '@nestjs/common';
import { CaseFormulationService } from './case-formulation.service';

@Controller('case-formulations')
export class CaseFormulationController {
  constructor(private readonly service: CaseFormulationService) {}

  @Get(':userId/latest')
  async findLatest(@Param('userId') userId: string) {
    return this.service.findLatest(userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
