import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  async findAll() {
    return this.agentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const agent = await this.agentsService.findOne(id);
    if (!agent) return { error: 'Agent not found' };
    return agent;
  }

  @Post()
  async create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }
}
