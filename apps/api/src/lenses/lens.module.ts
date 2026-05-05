import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LensController } from './lens.controller';
import { LensService } from './lens.service';

@Module({
  imports: [PrismaModule],
  controllers: [LensController],
  providers: [LensService],
  exports: [LensService],
})
export class LensModule {}
