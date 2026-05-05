import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class InsightController {
  constructor(private prisma: PrismaService) {}

  @Get('assessments')
  async findAllAssessments() {
    return this.prisma.assessment.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('case-formulations')
  async findAllFormulations() {
    return this.prisma.caseFormulation.findMany({
      orderBy: { version: 'desc' },
    });
  }
}
