import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { LensService } from './lens.service';

@Controller('lenses')
export class LensController {
  constructor(private readonly service: LensService) {}

  /**
   * GET /lenses
   * 发现页列表。
   */
  @Get()
  async list(
    @Query('visibility') visibility?: string,
    @Query('authorId') authorId?: string,
    @Query('query') query?: string,
    @Query('sortBy') sortBy?: 'popular' | 'recent' | 'rating',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.list({
      visibility,
      authorId,
      query,
      sortBy,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * GET /lenses/:id
   * 详情。
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  /**
   * POST /lenses
   * 创建 Lens。
   */
  @Post()
  async create(@Body() data: Parameters<typeof this.service.create>[0]) {
    return this.service.create(data);
  }

  /**
   * PATCH /lenses/:id
   * 更新 Lens。
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Parameters<typeof this.service.update>[1],
    @Body('userId') userId: string,
  ) {
    return this.service.update(id, data, userId);
  }

  /**
   * DELETE /lenses/:id
   * 删除 Lens。
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.delete(id, userId);
  }

  /**
   * POST /lenses/:id/fork
   * Fork Lens。
   */
  @Post(':id/fork')
  async fork(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('userName') userName?: string,
  ) {
    return this.service.fork(id, userId, userName);
  }
}
