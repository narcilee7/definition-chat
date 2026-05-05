import { Injectable, OnModuleInit } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from './prisma/prisma.service';
import { globalRegistry, AgentPersona, MemoryType } from '@ohme/agent-framework';

@Injectable()
export class AgentLoaderService implements OnModuleInit {
  private readonly logger = createLogger('AgentLoaderService');

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const personas = await this.prisma.therapistPersona.findMany({
      include: { approach: true },
    });

    const agentPersonas: AgentPersona[] = personas.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      systemPrompt: p.systemPrompt,
      color: p.approach?.name === 'cbt' ? '#2563EB' : p.approach?.name === 'dbt' ? '#7C3AED' : p.approach?.name === 'act' ? '#059669' : '#4B5563',
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      memory: { type: MemoryType.Buffer, maxMessages: 20 },
    }));

    globalRegistry.registerMany(agentPersonas);
    this.logger.info(`Loaded ${agentPersonas.length} personas into registry`);
  }
}
