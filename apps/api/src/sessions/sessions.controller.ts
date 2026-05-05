import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async findAll(@Query('userId') userId?: string) {
    return this.sessionsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post(':id/messages')
  async addMessage(@Param('id') id: string, @Body() body: { role: string; content: string }) {
    return this.sessionsService.addMessage(id, body.role, body.content);
  }

  @Post(':id/feedback')
  async submitFeedback(
    @Param('id') id: string,
    @Body() body: { allianceRating: number; moodAfter?: number; note?: string },
  ) {
    return this.sessionsService.submitFeedback(id, body);
  }

  @Post(':id/mood')
  async submitMoodCheckIn(
    @Param('id') id: string,
    @Body() body: { moodScore: number; anxietyScore?: number; stressScore?: number; note?: string },
  ) {
    return this.sessionsService.submitMoodCheckIn(id, body);
  }

  @Patch(':id/homework/:index')
  async updateHomework(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() body: { completed: boolean; reflection?: string },
  ) {
    return this.sessionsService.updateHomework(id, Number(index), body);
  }
}
