import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  compileV5SystemPrompt,
  V5CompileOptions,
  compressV5IfNeeded,
} from '@ohme/prompts';

@Injectable()
export class PromptBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildSystemPrompt(params: {
    userId: string;
    sessionId: string;
    sessionNumber: number;
    phase: string;
    presentingProblem?: string;
    agenda?: Array<{ topic: string; priority: string; status: string }>;
    homeworkReview?: Array<{ task: string; completed: boolean }>;
    previousSessionSummary?: string;
    insights?: string[];
    skillsIntroduced?: string[];
  }): Promise<string> {
    const {
      userId,
      sessionId,
      sessionNumber,
      phase,
      presentingProblem,
      agenda,
      homeworkReview,
      previousSessionSummary,
      insights,
      skillsIntroduced,
    } = params;

    // 1. 加载治疗师人格
    const session = await this.prisma.therapySession.findUnique({
      where: { id: sessionId },
      include: { therapist: true },
    });

    if (!session) throw new Error('Session not found');

    const persona = session.therapist;

    // 2. 加载个案概念化
    const caseFormulation = await this.prisma.caseFormulation.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });

    // 3. 提取本次会话中的历史洞察（如果没有传入）
    const previousInsights =
      insights && insights.length > 0
        ? insights
        : await this.extractInsights(sessionId);

    // 4. 构建 V5 编译选项
    const compileOptions: V5CompileOptions = {
      sessionNumber,
      phase,
      presentingProblem,
      agenda,
      homeworkReview,
      previousSessionSummary,
      previousInsights: previousInsights.length > 0 ? previousInsights : undefined,
      skillsIntroduced: skillsIntroduced && skillsIntroduced.length > 0 ? skillsIntroduced : undefined,
      persona: {
        name: persona.name,
        description: persona.description,
        voiceTone: persona.voiceTone,
        responseLength: 'concise',
        styleTraits: (persona.styleTraits as any) || {},
        specialties: persona.specialties,
      },
      caseFormulation: caseFormulation
        ? {
            presentingProblems: caseFormulation.presentingProblems,
            triggers: caseFormulation.triggers,
            thoughts: caseFormulation.thoughts,
            emotions: caseFormulation.emotions,
            behaviors: caseFormulation.behaviors,
            physical: caseFormulation.physical,
            coreBeliefs: caseFormulation.coreBeliefs,
            intermediateBeliefs: caseFormulation.intermediateBeliefs,
            copingStrategies: caseFormulation.copingStrategies,
            formativeEvents: caseFormulation.formativeEvents,
            treatmentGoals: (caseFormulation.treatmentGoals as any[])?.map((g: any) => ({
              goal: g.goal,
              timeframe: g.timeframe,
              measures: g.measures,
            })),
            confidence: caseFormulation.confidence,
            version: caseFormulation.version,
          }
        : undefined,
    };

    // 5. 编译 system prompt
    const systemPrompt = compileV5SystemPrompt(compileOptions);

    // 6. 如果太长，智能压缩
    return compressV5IfNeeded(systemPrompt, 4000);
  }

  /**
   * 从会话历史中提取核心洞察（用于注入对话上下文）。
   */
  private async extractInsights(sessionId: string): Promise<string[]> {
    const messages = await this.prisma.sessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    // 简单启发式：找 therapist 消息中的关键洞察句
    const insights: string[] = [];
    for (const msg of messages) {
      if (msg.role !== 'therapist') continue;

      const sentences = msg.content.split(/[。！？\n]/);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (
          trimmed.length > 10 &&
          trimmed.length < 100 &&
          (/原来|其实是|可能|或许|听起来|你有没有想过|像是|就像|我注意到|我好奇|模式/.test(trimmed))
        ) {
          insights.push(trimmed);
        }
      }
    }

    return insights.slice(-3); // 只取最近 3 个
  }
}
