import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class InsightController {
  constructor(private prisma: PrismaService) {}

  @Get('memory-notes')
  async findAllNotes() {
    return this.prisma.memoryNote.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('user-context')
  async findContext() {
    return this.prisma.userContext.findUnique({
      where: { userId: 'default' },
    });
  }
}
