import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async chat(body: { sessionId: string; agentId: string; content: string }) {
    // TODO: implement LLM chat flow
    return { message: { id: 'temp', role: 'agent', content: '...', createdAt: new Date().toISOString() } };
  }

  async multiChat(body: { sessionId: string; agentIds: string[]; content: string }) {
    // TODO: implement parallel LLM chat
    return { messages: [] };
  }
}
