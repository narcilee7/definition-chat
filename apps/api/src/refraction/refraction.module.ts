import { Module } from '@nestjs/common';
import { RefractionService } from './refraction.service';
import { RefractionController } from './refraction.controller';

@Module({
  providers: [RefractionService],
  controllers: [RefractionController],
})
export class RefractionModule {}
