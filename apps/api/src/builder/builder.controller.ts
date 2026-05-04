import { Controller, Post, Body } from '@nestjs/common';
import { BuilderService } from './builder.service';

@Controller('builder')
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  @Post('chat')
  async chat(@Body() body: { sessionId: string; content: string }) {
    return this.builderService.chat(body);
  }

  @Post('confirm')
  async confirm(@Body() body: { draft: unknown }) {
    return this.builderService.confirm(body.draft);
  }
}
