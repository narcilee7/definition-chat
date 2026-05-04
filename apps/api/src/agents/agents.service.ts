import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const agents = await this.prisma.agent.findMany({
      orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'desc' }],
    });
    return agents.map((a) => this.serializeAgent(a));
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id } });
    if (!agent) return null;
    return this.serializeAgent(agent);
  }

  async findByName(name: string) {
    const agent = await this.prisma.agent.findUnique({ where: { name } });
    if (!agent) return null;
    return this.serializeAgent(agent);
  }

  async create(dto: CreateAgentDto) {
    const agent = await this.prisma.agent.create({
      data: {
        name: dto.name,
        role: dto.role,
        tone: dto.tone,
        color: dto.color,
        description: dto.description,
        coreTraits: dto.coreTraits,
        communicationStyle: dto.communicationStyle,
        expertise: dto.expertise,
        backgroundStory: dto.backgroundStory,
        openingStyle: dto.openingStyle,
        lengthPreference: dto.lengthPreference,
        forbiddenTopics: dto.forbiddenTopics,
        systemPrompt: dto.systemPrompt,
        isBuiltIn: dto.isBuiltIn ?? false,
      },
    });
    return this.serializeAgent(agent);
  }

  async remove(id: string) {
    await this.prisma.agent.delete({ where: { id } });
    return { success: true };
  }

  private serializeAgent(agent: any) {
    return {
      ...agent,
      coreTraits: this.safeJsonParse(agent.coreTraits, []),
      expertise: this.safeJsonParse(agent.expertise, []),
      forbiddenTopics: this.safeJsonParse(agent.forbiddenTopics, []),
    };
  }

  private safeJsonParse(str: string, fallback: unknown) {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }
}
