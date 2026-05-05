import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentsService {
  private readonly logger = createLogger('AgentsService');

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.therapistPersona.findMany({
      orderBy: [{ isBuiltIn: 'desc' }],
      include: { approach: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.therapistPersona.findUnique({
      where: { id },
      include: { approach: true },
    });
  }

  async create(data: any) {
    const persona = await this.prisma.therapistPersona.create({ data });
    this.logger.info('Persona created', { personaId: persona.id, name: persona.name });
    return persona;
  }

  async remove(id: string) {
    await this.prisma.therapistPersona.delete({ where: { id } });
    this.logger.info('Persona removed', { personaId: id });
    return { success: true };
  }
}
