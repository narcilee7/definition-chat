import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AssessmentService, ScaleSubmission } from './assessment.service';

@Controller('assessments')
export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @Get('questions/:type')
  getQuestions(@Param('type') type: string) {
    return this.service.getScaleQuestions(type);
  }

  @Post()
  async submit(@Body() data: ScaleSubmission) {
    return this.service.submitScale(data);
  }

  @Get()
  async findByUser(@Query('userId') userId: string) {
    return this.service.findByUser(userId || 'default');
  }

  @Get('trend')
  async getTrend(
    @Query('userId') userId: string,
    @Query('type') type: string,
  ) {
    return this.service.getTrend(userId || 'default', type);
  }

  @Get(':type/latest')
  async findLatest(
    @Param('type') type: string,
    @Query('userId') userId: string,
  ) {
    return this.service.findLatestByType(userId || 'default', type);
  }
}
