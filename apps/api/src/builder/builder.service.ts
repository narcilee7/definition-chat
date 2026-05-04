import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BuilderService {
  constructor(private prisma: PrismaService) {}

  async chat(body: { sessionId: string; content: string }) {
    // TODO: AI-native builder conversation flow
    return { message: { id: 'temp', role: 'builder', content: '...', createdAt: new Date().toISOString() } };
  }

  async confirm(draft: unknown) {
    // TODO: save confirmed agent to database
    return this.prisma.agent.create({ data: draft as never });
  }
}
