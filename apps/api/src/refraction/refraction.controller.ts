import { Controller, Post, Body } from '@nestjs/common';
import { RefractionService, RefractionRequest } from './refraction.service';

@Controller('refraction')
export class RefractionController {
  constructor(private readonly service: RefractionService) {}

  @Post()
  async refract(@Body() data: RefractionRequest) {
    return this.service.refract(data);
  }
}
