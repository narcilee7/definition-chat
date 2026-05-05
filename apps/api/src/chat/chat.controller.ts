import { Controller, Post, Body, Res, Get, Param } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { TherapyChatDto, CreateTherapySessionDto } from './dto/therapy-chat.dto';
import { SessionManagerService } from '../therapy/session-manager.service';

@Controller('therapy')
export class ChatController {
  private readonly logger = createLogger('ChatController');

  constructor(
    private readonly chatService: ChatService,
    private readonly sessionManager: SessionManagerService,
  ) {}

  @Post('sessions')
  async createSession(@Body() dto: CreateTherapySessionDto) {
    const state = await this.sessionManager.createSession(dto.userId, dto.therapistId);
    return { sessionId: state.sessionId, phase: state.phase };
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    const session = await this.sessionManager.getSessionState(id);
    if (!session) return { error: 'Session not found' };

    const dbSession = await this.chatService['prisma'].therapySession.findUnique({
      where: { id },
      include: { therapist: { include: { approach: true } }, messages: { orderBy: { createdAt: 'asc' } } },
    });

    return { ...session, ...dbSession };
  }

  @Post('chat')
  async chat(@Body() dto: TherapyChatDto) {
    try {
      return await this.chatService.chat(dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chat failed';
      this.logger.error('Chat request failed', { sessionId: dto.sessionId, error: err });
      return { error: msg };
    }
  }

  @Post('chat/stream')
  async streamChat(@Body() dto: TherapyChatDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.chatService.streamChat(dto)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Stream failed';
      this.logger.error('Stream chat failed', { sessionId: dto.sessionId, error: err });
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }

  @Post('sessions/:id/phase')
  async setPhase(@Param('id') id: string, @Body('phase') phase: string) {
    const state = this.sessionManager.setPhase(id, phase as any);
    if (!state) return { error: 'Session not found' };
    await this.sessionManager.persistSession(id);
    return { phase: state.phase };
  }
}
