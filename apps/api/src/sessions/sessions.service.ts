import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  private readonly logger = createLogger('SessionsService');

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSessionDto) {
    const session = await this.prisma.session.create({
      data: {
        title: dto.title || this.generateTitle(),
        intent: dto.intent,
        mood: dto.mood,
      },
    });
    this.logger.info('Session created', { sessionId: session.id, title: session.title });
    return session;
  }

  async findAll() {
    return this.prisma.session.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async addMessage(sessionId: string, role: string, content: string) {
    const message = await this.prisma.message.create({
      data: { sessionId, role, content },
    });
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    this.logger.debug('Message added', { sessionId, role, messageId: message.id });
    return message;
  }

  async updateNotes(sessionId: string, notes: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { notes },
    });
  }

  private generateTitle(): string {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return `探索 ${time}`;
  }
}
