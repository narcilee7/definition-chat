import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto, MultiChatDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() dto: ChatDto) {
    try {
      return await this.chatService.chat(dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Chat failed';
      return { error: msg };
    }
  }

  @Post('multi')
  async multiChat(@Body() dto: MultiChatDto) {
    try {
      return await this.chatService.multiChat(dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Multi-chat failed';
      return { error: msg };
    }
  }
}
