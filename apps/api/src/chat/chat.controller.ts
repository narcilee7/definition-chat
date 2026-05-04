import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: { sessionId: string; agentId: string; content: string }) {
    return this.chatService.chat(body);
  }

  @Post('multi')
  async multiChat(@Body() body: { sessionId: string; agentIds: string[]; content: string }) {
    return this.chatService.multiChat(body);
  }
}
