import { Body, Controller, Post } from '@nestjs/common';
import { ExploreRequest, ExploreService } from './explore.service';

@Controller('explore')
export class ExploreController {
  constructor(private readonly service: ExploreService) {}

  @Post()
  async explore(@Body() data: ExploreRequest) {
    return this.service.explore(data);
  }
}
