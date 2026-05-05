import { Injectable } from '@nestjs/common';
import { SessionPhase, PhaseContext } from '@ohme/prompts';
import { SessionState } from './session-manager.service';

@Injectable()
export class PhaseManagerService {
  getPhaseContext(sessionState: SessionState): PhaseContext {
    return {
      phase: sessionState.phase as SessionPhase,
      sessionNumber: 1,
      agenda: sessionState.agenda,
    };
  }
}
