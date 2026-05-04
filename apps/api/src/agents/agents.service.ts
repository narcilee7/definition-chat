import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.agent.findMany();
  }

  async findOne(id: string) {
    return this.prisma.agent.findUnique({ where: { id } });
  }

  async create(data: unknown) {
    return this.prisma.agent.create({ data: data as never });
  }

  async remove(id: string) {
    return this.prisma.agent.delete({ where: { id } });
  }
}
