import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(body: { mode: string; agentIds: string[]; title?: string }) {
    return this.prisma.session.create({
      data: {
        mode: body.mode,
        agentIds: body.agentIds,
        title: body.title || 'New Session',
      } as never,
    });
  }

  async findAll() {
    return this.prisma.session.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async findOne(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }
}
