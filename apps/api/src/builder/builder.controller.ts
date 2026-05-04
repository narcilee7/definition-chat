import { Controller, Post, Body } from '@nestjs/common';
import { BuilderService } from './builder.service';
import { BuilderChatDto, ConfirmAgentDto } from './dto/builder-chat.dto';

@Controller('builder')
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  @Post('chat')
  async chat(@Body() dto: BuilderChatDto) {
    try {
      return await this.builderService.chat(dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Builder chat failed';
      return { error: msg };
    }
  }

  @Post('confirm')
  async confirm(@Body() dto: ConfirmAgentDto) {
    try {
      return await this.builderService.confirm(dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Confirm failed';
      return { error: msg };
    }
  }
}
