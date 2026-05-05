import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CaseFormulationService {
  private readonly logger = createLogger('CaseFormulationService');

  constructor(private prisma: PrismaService) {}

  async findLatest(userId: string) {
    return this.prisma.caseFormulation.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.caseFormulation.findUnique({ where: { id } });
  }

  async createInitial(userId: string, presentingProblems: string) {
    const existing = await this.findLatest(userId);

    return this.prisma.caseFormulation.create({
      data: {
        userId,
        presentingProblems,
        coreBeliefs: [],
        intermediateBeliefs: [],
        copingStrategies: [],
        treatmentGoals: [],
        confidence: 0.2,
        version: (existing?.version || 0) + 1,
        previousVersion: existing?.id,
      },
    });
  }

  async updateFromSession(userId: string, sessionData: {
    triggers?: string;
    thoughts?: string;
    emotions?: string;
    behaviors?: string;
    physical?: string;
    newCoreBeliefs?: string[];
    newIntermediateBeliefs?: string[];
    newCopingStrategies?: string[];
    newGoals?: Array<{ goal: string; timeframe: string }>;
  }) {
    const latest = await this.findLatest(userId);
    if (!latest) {
      this.logger.warn('No case formulation found for update', { userId });
      return null;
    }

    const updated = await this.prisma.caseFormulation.create({
      data: {
        userId,
        presentingProblems: latest.presentingProblems,
        triggers: sessionData.triggers ?? latest.triggers,
        thoughts: sessionData.thoughts ?? latest.thoughts,
        emotions: sessionData.emotions ?? latest.emotions,
        behaviors: sessionData.behaviors ?? latest.behaviors,
        physical: sessionData.physical ?? latest.physical,
        coreBeliefs: [...latest.coreBeliefs, ...(sessionData.newCoreBeliefs || [])],
        intermediateBeliefs: [...latest.intermediateBeliefs, ...(sessionData.newIntermediateBeliefs || [])],
        copingStrategies: [...latest.copingStrategies, ...(sessionData.newCopingStrategies || [])],
        treatmentGoals: [...(latest.treatmentGoals as any[]), ...(sessionData.newGoals || [])],
        confidence: Math.min(latest.confidence + 0.1, 1.0),
        version: latest.version + 1,
        previousVersion: latest.id,
      },
    });

    this.logger.info('Case formulation updated', { userId, version: updated.version });
    return updated;
  }
}
