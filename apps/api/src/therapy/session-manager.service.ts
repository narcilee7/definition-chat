import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';

export type SessionPhase = 'agenda_setting' | 'mood_check' | 'theme_work' | 'summary';

export interface SessionState {
  sessionId: string;
  phase: SessionPhase;
  agenda: Array<{ topic: string; priority: 'high' | 'medium' | 'low'; status: 'pending' | 'in_progress' | 'completed' }>;
  homework: Array<{ task: string; completed: boolean }>;
  insights: string[];
  skillsIntroduced: string[];
  riskLevel: string;
}

@Injectable()
export class SessionManagerService {
  private readonly logger = createLogger('SessionManagerService');
  private sessionStates = new Map<string, SessionState>();

  constructor(private prisma: PrismaService) {}

  async createSession(userId: string, therapistId: string): Promise<SessionState> {
    // Count existing sessions for this user + therapist
    const existingCount = await this.prisma.therapySession.count({
      where: { userId, therapistId },
    });

    const session = await this.prisma.therapySession.create({
      data: {
        userId,
        therapistId,
        sessionNumber: existingCount + 1,
        phase: 'active',
        agenda: [],
        riskLevel: 'none',
        insights: [],
        homework: [],
        skillsIntroduced: [],
      },
    });

    const state: SessionState = {
      sessionId: session.id,
      phase: 'agenda_setting',
      agenda: [],
      homework: [],
      insights: [],
      skillsIntroduced: [],
      riskLevel: 'none',
    };

    this.sessionStates.set(session.id, state);
    this.logger.info('Therapy session created', { sessionId: session.id, userId, therapistId, sessionNumber: session.sessionNumber });

    return state;
  }

  async getSessionState(sessionId: string): Promise<SessionState | null> {
    // Check memory cache first
    const cached = this.sessionStates.get(sessionId);
    if (cached) return cached;

    // Load from DB
    const session = await this.prisma.therapySession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return null;

    const state: SessionState = {
      sessionId: session.id,
      phase: (session.agenda as any[])?.length > 0 && (session.agenda as any[]).every((a) => a.status === 'completed')
        ? 'summary'
        : (session.agenda as any[])?.length > 0
          ? 'theme_work'
          : 'agenda_setting',
      agenda: (session.agenda as any[]) || [],
      homework: (session.homework as any[]) || [],
      insights: session.insights || [],
      skillsIntroduced: session.skillsIntroduced || [],
      riskLevel: session.riskLevel,
    };

    this.sessionStates.set(sessionId, state);
    return state;
  }

  advancePhase(sessionId: string): SessionState | null {
    const state = this.sessionStates.get(sessionId);
    if (!state) return null;

    const phaseOrder: SessionPhase[] = ['agenda_setting', 'mood_check', 'theme_work', 'summary'];
    const currentIdx = phaseOrder.indexOf(state.phase);
    if (currentIdx < phaseOrder.length - 1) {
      state.phase = phaseOrder[currentIdx + 1];
      this.logger.info('Phase advanced', { sessionId, phase: state.phase });
    }

    return state;
  }

  setPhase(sessionId: string, phase: SessionPhase): SessionState | null {
    const state = this.sessionStates.get(sessionId);
    if (!state) return null;

    state.phase = phase;
    this.logger.info('Phase set', { sessionId, phase });
    return state;
  }

  addAgendaItem(sessionId: string, topic: string, priority: 'high' | 'medium' | 'low' = 'medium'): SessionState | null {
    const state = this.sessionStates.get(sessionId);
    if (!state) return null;

    state.agenda.push({ topic, priority, status: 'pending' });
    return state;
  }

  completeAgendaItem(sessionId: string, topic: string): SessionState | null {
    const state = this.sessionStates.get(sessionId);
    if (!state) return null;

    const item = state.agenda.find((a) => a.topic === topic);
    if (item) item.status = 'completed';
    return state;
  }

  addInsight(sessionId: string, insight: string): SessionState | null {
    const state = this.sessionStates.get(sessionId);
    if (!state) return null;

    state.insights.push(insight);
    return state;
  }

  addSkill(sessionId: string, skill: string): SessionState | null {
    const state = this.sessionStates.get(sessionId);
    if (!state) return null;

    state.skillsIntroduced.push(skill);
    return state;
  }

  setRiskLevel(sessionId: string, riskLevel: string): SessionState | null {
    const state = this.sessionStates.get(sessionId);
    if (!state) return null;

    state.riskLevel = riskLevel;
    return state;
  }

  async persistSession(sessionId: string): Promise<void> {
    const state = this.sessionStates.get(sessionId);
    if (!state) return;

    await this.prisma.therapySession.update({
      where: { id: sessionId },
      data: {
        agenda: state.agenda as any,
        homework: state.homework as any,
        insights: state.insights,
        skillsIntroduced: state.skillsIntroduced,
        riskLevel: state.riskLevel,
      },
    });

    this.logger.info('Session state persisted', { sessionId });
  }
}
