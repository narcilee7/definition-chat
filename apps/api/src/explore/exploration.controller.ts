import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ExplorationService } from './exploration.service';

@Controller('exploration')
export class ExplorationController {
  constructor(private readonly service: ExplorationService) {}

  /**
   * POST /exploration/sessions
   * 创建新的 Exploration Session。
   */
  @Post('sessions')
  async createSession(@Body() data: { userId: string; lensId: string; question: string; customLens?: unknown }) {
    return this.service.createSession(data);
  }

  /**
   * GET /exploration/sessions/:id
   * 获取 Exploration Session 详情。
   */
  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.service.getSession(id);
  }

  /**
   * POST /exploration/sessions/:id/messages
   * 发送消息，驱动状态机。
   */
  @Post('sessions/:id/messages')
  async sendMessage(@Param('id') sessionId: string, @Body() data: { userInput: string }) {
    return this.service.sendMessage({ sessionId, userInput: data.userInput });
  }

  /**
   * POST /exploration/sessions/:id/save
   * 将深潜产物保存到 Self Model。
   */
  @Post('sessions/:id/save')
  async saveToSelfModel(@Param('id') sessionId: string) {
    return this.service.saveToSelfModel(sessionId);
  }

  /**
   * GET /exploration/users/:userId/sessions
   * 获取用户的所有 Exploration Sessions。
   */
  @Get('users/:userId/sessions')
  async listUserSessions(@Param('userId') userId: string) {
    return this.service.listUserSessions(userId);
  }
}
