import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LensController } from './lens.controller';
import { LensService } from './lens.service';
import { LensSyncService } from './lens-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [LensController],
  providers: [LensService, LensSyncService],
  exports: [LensService],
})
export class LensModule {}
