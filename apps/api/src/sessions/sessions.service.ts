import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    return this.prisma.therapySession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { therapist: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    return this.prisma.therapySession.findUnique({
      where: { id },
      include: { therapist: { include: { approach: true } }, messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async addMessage(sessionId: string, role: string, content: string) {
    const message = await this.prisma.sessionMessage.create({
      data: { sessionId, role, content },
    });
    await this.prisma.therapySession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    return message;
  }
}
