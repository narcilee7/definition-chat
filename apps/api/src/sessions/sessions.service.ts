import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSessionDto) {
    const session = await this.prisma.session.create({
      data: {
        mode: dto.mode,
        agentIds: JSON.stringify(dto.agentIds),
        title: dto.title || this.generateTitle(dto.mode),
      },
    });
    return this.serializeSession(session);
  }

  async findAll() {
    const sessions = await this.prisma.session.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map((s) => this.serializeSession(s));
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return null;
    return this.serializeSession(session);
  }

  async addMessage(sessionId: string, role: string, content: string, agentId?: string) {
    const message = await this.prisma.message.create({
      data: {
        sessionId,
        role,
        content,
        agentId,
      },
    });
    // Update session updatedAt
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  private generateTitle(mode: string): string {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (mode === 'single') return `单Agent对话 ${time}`;
    if (mode === 'multi') return `多Agent对话 ${time}`;
    if (mode === 'build') return `Agent构建 ${time}`;
    return `新对话 ${time}`;
  }

  private serializeSession(session: any) {
    return {
      ...session,
      agentIds: this.safeJsonParse(session.agentIds, []),
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
