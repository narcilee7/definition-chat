import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
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
}
