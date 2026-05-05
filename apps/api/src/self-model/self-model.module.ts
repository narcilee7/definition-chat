import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SelfModelController } from './self-model.controller';
import { SelfModelService } from './self-model.service';

@Module({
  imports: [PrismaModule],
  controllers: [SelfModelController],
  providers: [SelfModelService],
  exports: [SelfModelService],
})
export class SelfModelModule {}
