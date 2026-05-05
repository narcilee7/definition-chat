import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SessionManagerService } from '../therapy/session-manager.service';
import { PromptBuilderService } from '../therapy/prompt-builder.service';
import { RiskDetectorService } from '../risk/risk-detector.service';
import { CrisisInterventionService } from '../risk/crisis-intervention.service';
import { LLMFallbackService } from '../llm/llm-fallback.service';
import { CaseFormulationService } from '../case-formulation/case-formulation.service';

@Module({
  providers: [
    ChatService,
    SessionManagerService,
    PromptBuilderService,
    RiskDetectorService,
    CrisisInterventionService,
    LLMFallbackService,
    CaseFormulationService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
