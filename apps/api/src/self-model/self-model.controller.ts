import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SelfModelService } from './self-model.service';

@Controller('self-model')
export class SelfModelController {
  constructor(private readonly service: SelfModelService) {}

  /**
   * GET /self-model/:userId
   * 获取用户 Self Model 概览。
   */
  @Get(':userId')
  async getOverview(@Param('userId') userId: string) {
    return this.service.getOverview(userId);
  }

  /**
   * GET /self-model/:userId/entries
   * 获取所有 Entries。
   */
  @Get(':userId/entries')
  async listEntries(
    @Param('userId') userId: string,
    @Query('entryType') entryType?: string,
    @Query('lensId') lensId?: string,
  ) {
    return this.service.listEntries(userId, { entryType, lensId });
  }

  /**
   * GET /self-model/entries/:id
   * 获取单个 Entry。
   */
  @Get('entries/:id')
  async getEntry(@Param('id') id: string) {
    return this.service.getEntry(id);
  }

  /**
   * PATCH /self-model/entries/:id
   * 更新 Entry。
   */
  @Patch('entries/:id')
  async updateEntry(
    @Param('id') id: string,
    @Body() data: { newNarrative?: string; tags?: string[]; userEdited?: boolean },
  ) {
    return this.service.updateEntry(id, data);
  }

  /**
   * DELETE /self-model/entries/:id
   * 删除 Entry。
   */
  @Delete('entries/:id')
  async deleteEntry(@Param('id') id: string) {
    return this.service.deleteEntry(id);
  }

  /**
   * GET /self-model/:userId/experiments
   * 获取实验列表。
   */
  @Get(':userId/experiments')
  async listExperiments(@Param('userId') userId: string, @Query('status') status?: string) {
    return this.service.listExperiments(userId, status);
  }

  /**
   * POST /self-model/:userId/experiments
   * 创建实验。
   */
  @Post(':userId/experiments')
  async createExperiment(
    @Param('userId') userId: string,
    @Body() data: { description: string; sourceLensId: string; sourceLensName?: string },
  ) {
    const selfModel = await this.service.getOrCreate(userId);
    return this.service.createExperiment({
      selfModelId: selfModel.id,
      ...data,
    });
  }

  /**
   * PATCH /self-model/experiments/:id
   * 更新实验状态。
   */
  @Patch('experiments/:id')
  async updateExperiment(
    @Param('id') id: string,
    @Body() data: { status?: 'pending' | 'active' | 'completed' | 'dropped'; reflection?: string },
  ) {
    return this.service.updateExperiment(id, data);
  }

  /**
   * GET /self-model/:userId/insights
   * 获取 Insight Stream。
   */
  @Get(':userId/insights')
  async generateInsights(@Param('userId') userId: string) {
    return this.service.generateInsights(userId);
  }
}
