import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async findAll() {
    return this.sessionsService.findAll();
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
