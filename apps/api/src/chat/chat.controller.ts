import { Controller, Post, Body, Res } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  private readonly logger = createLogger('ChatController');

  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() dto: ChatDto) {
    try {
      return await this.chatService.chat(dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chat failed';
      this.logger.error('Chat request failed', { sessionId: dto.sessionId, error: err });
      return { error: msg };
    }
  }

  @Post('stream')
  async streamChat(@Body() dto: ChatDto, @Res() res: Response) {
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
}
