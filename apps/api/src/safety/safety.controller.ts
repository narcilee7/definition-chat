import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SafetyPlanService } from './safety-plan.service';

@Controller('safety-plans')
export class SafetyController {
  constructor(private readonly service: SafetyPlanService) {}

  @Get(':userId')
  async findOne(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Post(':userId')
  async upsert(@Param('userId') userId: string, @Body() data: any) {
    return this.service.upsert(userId, data);
  }
}
