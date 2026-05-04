import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.sessionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const session = await this.sessionsService.findOne(id);
    if (!session) return { error: 'Session not found' };
    return session;
  }
}
