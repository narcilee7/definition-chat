import { Module } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';
import { PhaseManagerService } from './phase-manager.service';
import { PromptBuilderService } from './prompt-builder.service';

@Module({
  providers: [SessionManagerService, PhaseManagerService, PromptBuilderService],
  exports: [SessionManagerService, PhaseManagerService, PromptBuilderService],
})
export class TherapyModule {}
