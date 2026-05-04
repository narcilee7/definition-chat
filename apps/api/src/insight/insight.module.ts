import { Module } from '@nestjs/common';
import { InsightEngine } from './insight.engine';
import { InsightController } from './insight.controller';

@Module({
  controllers: [InsightController],
  providers: [InsightEngine],
  exports: [InsightEngine],
})
export class InsightModule {}
