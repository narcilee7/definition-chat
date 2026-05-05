import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { PHQ9_QUESTIONS, interpretPHQ9, GAD7_QUESTIONS, interpretGAD7 } from '@ohme/prompts';

export interface ScaleSubmission {
  userId: string;
  type: 'PHQ-9' | 'GAD-7';
  responses: Array<{ questionId: string; score: number; text: string }>;
  sessionId?: string;
  isBaseline?: boolean;
}

@Injectable()
export class AssessmentService {
  private readonly logger = createLogger('AssessmentService');

  constructor(private prisma: PrismaService) {}

  getScaleQuestions(type: string) {
    switch (type) {
      case 'PHQ-9':
        return { type, name: 'PHQ-9 抑郁量表', description: '过去两周，你有多少时间受到以下问题的困扰？', questions: PHQ9_QUESTIONS };
      case 'GAD-7':
        return { type, name: 'GAD-7 焦虑量表', description: '过去两周，你有多少时间受到以下问题的困扰？', questions: GAD7_QUESTIONS };
      default:
        throw new Error(`Unknown scale type: ${type}`);
    }
  }

  async submitScale(data: ScaleSubmission) {
    const totalScore = data.responses.reduce((sum, r) => sum + r.score, 0);

    let interpretation;
    let riskFlags: string[] = [];

    if (data.type === 'PHQ-9') {
      interpretation = interpretPHQ9(totalScore);
      // Check suicidal ideation (question 9)
      const q9 = data.responses.find((r) => r.questionId === 'phq9_9');
      if (q9 && q9.score > 0) {
        riskFlags.push('suicidal_ideation');
      }
    } else if (data.type === 'GAD-7') {
      interpretation = interpretGAD7(totalScore);
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        userId: data.userId,
        type: data.type,
        name: data.type === 'PHQ-9' ? 'PHQ-9 抑郁量表' : 'GAD-7 焦虑量表',
        description: interpretation?.recommendation || '',
        responses: data.responses as any,
        totalScore,
        severity: interpretation?.severity || '',
        clinicalCutoff: interpretation?.clinicalCutoff || false,
        riskFlags,
        sessionId: data.sessionId,
        isBaseline: data.isBaseline || false,
      },
    });

    this.logger.info('Scale submitted', {
      userId: data.userId,
      type: data.type,
      totalScore,
      severity: interpretation?.severity,
      riskFlags,
    });

    return {
      assessment,
      interpretation: {
        ...interpretation,
        riskFlags,
      },
    };
  }

  async findByUser(userId: string) {
    return this.prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestByType(userId: string, type: string) {
    return this.prisma.assessment.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTrend(userId: string, type: string) {
    const assessments = await this.prisma.assessment.findMany({
      where: { userId, type },
      orderBy: { createdAt: 'asc' },
      select: { totalScore: true, createdAt: true, severity: true },
    });

    return assessments.map((a) => ({
      score: a.totalScore,
      date: a.createdAt.toISOString().split('T')[0],
      severity: a.severity,
    }));
  }
}
