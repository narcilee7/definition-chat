import { Injectable, OnModuleInit } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from './prisma/prisma.service';
import { globalRegistry, AgentPersona, MemoryType } from '@ohme/agent-framework';

@Injectable()
export class AgentLoaderService implements OnModuleInit {
  private readonly logger = createLogger('AgentLoaderService');

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const agents = await this.prisma.agent.findMany();
    const personas: AgentPersona[] = agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      systemPrompt: a.systemPrompt,
      color: a.color,
      temperature: 0.7,
      maxTokens: 512,
      memory: { type: MemoryType.Buffer, maxMessages: 20 },
    }));

    globalRegistry.registerMany(personas);
    this.logger.info(`Loaded ${personas.length} agents into registry`);
  }
}
