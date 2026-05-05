import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { LLMFallbackService } from '../llm/llm-fallback.service';
import {
  ExplorationPhase,
  ExplorationStateMachine,
} from './exploration-state-machine';
import { findLensFromRequest, LensDefinition } from '../lenses/lens-definitions';

export interface CreateSessionRequest {
  userId: string;
  lensId: string;
  question: string;
  customLens?: unknown;
}

export interface SendMessageRequest {
  sessionId: string;
  userInput: string;
}

export interface ExplorationSessionResponse {
  id: string;
  userId: string;
  lensId: string;
  lensName: string;
  originalQuestion: string;
  phase: ExplorationPhase;
  clarifiedQuestion?: string | null;
  identifiedSignals?: string[] | null;
  hypothesis?: string | null;
  userValidation?: string | null;
  revisedHypothesis?: string | null;
  newNarrative?: string | null;
  selectedExperiment?: string | null;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    phase: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  completedAt?: Date | null;
}

@Injectable()
export class ExplorationService {
  private readonly logger = createLogger('ExplorationService');
  private readonly stateMachine: ExplorationStateMachine;

  constructor(
    private readonly prisma: PrismaService,
    llm: LLMFallbackService,
  ) {
    this.stateMachine = new ExplorationStateMachine(llm, prisma);
  }

  /**
   * 创建新的 Exploration Session。
   * 如果 Lens 不存在，自动创建一个临时 Lens 记录（用于自定义 Lens）。
   */
  async createSession(data: CreateSessionRequest): Promise<ExplorationSessionResponse> {
    const { userId, lensId, question, customLens } = data;

    // 查找或创建 Lens
    let lensRecord = await this.prisma.lens.findUnique({ where: { id: lensId } });

    if (!lensRecord) {
      const lensDef = findLensFromRequest(lensId, customLens ? [customLens] : undefined);
      if (!lensDef) {
        throw new Error(`Lens not found: ${lensId}`);
      }
      // 为自定义 Lens 创建临时记录
      lensRecord = await this.prisma.lens.create({
        data: this.lensDefToCreateInput(lensDef, userId),
      });
    }

    const session = await this.prisma.explorationSession.create({
      data: {
        userId,
        lensId: lensRecord.id,
        originalQuestion: question.trim(),
        phase: 'clarify',
      },
      include: {
        lens: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    this.logger.info('Exploration session created', {
      sessionId: session.id,
      userId,
      lensId: lensRecord.id,
    });

    return this.toSessionResponse(session);
  }

  /**
   * 获取 Exploration Session 详情。
   */
  async getSession(sessionId: string): Promise<ExplorationSessionResponse> {
    const session = await this.prisma.explorationSession.findUnique({
      where: { id: sessionId },
      include: {
        lens: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return this.toSessionResponse(session);
  }

  /**
   * 发送消息，驱动状态机处理。
   */
  async sendMessage(data: SendMessageRequest): Promise<{
    session: ExplorationSessionResponse;
    lensReply: string;
    phaseChanged: boolean;
  }> {
    const { sessionId, userInput } = data;

    const session = await this.prisma.explorationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.phase === 'complete') {
      throw new Error('Session already completed');
    }

    const previousPhase = session.phase;

    // 调用状态机处理
    const { lensReply, nextPhase, fieldUpdates } = await this.stateMachine.process(
      sessionId,
      userInput.trim(),
    );

    // 更新会话字段
    const updateData: Record<string, unknown> = {
      phase: nextPhase,
      ...fieldUpdates,
    };

    if (nextPhase === 'complete') {
      updateData.completedAt = new Date();
    }

    await this.prisma.explorationSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    const phaseChanged = previousPhase !== nextPhase;

    this.logger.info('Exploration message processed', {
      sessionId,
      previousPhase,
      nextPhase,
      phaseChanged,
    });

    const updatedSession = await this.getSession(sessionId);

    return {
      session: updatedSession,
      lensReply,
      phaseChanged,
    };
  }

  /**
   * 保存深潜产物到 Self Model。
   * 在深潜完成后调用，生成 SelfModelEntry。
   */
  async saveToSelfModel(sessionId: string): Promise<{ entryId: string; experimentId?: string }> {
    const session = await this.prisma.explorationSession.findUnique({
      where: { id: sessionId },
      include: { lens: true },
    });

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.phase !== 'complete' && !session.newNarrative) {
      throw new Error('Session not ready to save');
    }

    // 确保用户有 SelfModel
    let selfModel = await this.prisma.selfModel.findUnique({
      where: { userId: session.userId },
    });

    if (!selfModel) {
      selfModel = await this.prisma.selfModel.create({
        data: { userId: session.userId },
      });
    }

    // 创建 SelfModelEntry
    const entry = await this.prisma.selfModelEntry.create({
      data: {
        selfModelId: selfModel.id,
        entryType: 'new_narrative',
        originalNarrative: session.originalQuestion,
        newNarrative: session.newNarrative || session.originalQuestion,
        lensId: session.lensId,
        lensName: session.lens.name,
        question: session.originalQuestion,
        sessionId: session.id,
        tags: [],
      },
    });

    // 关联 session 到 entry
    await this.prisma.explorationSession.update({
      where: { id: sessionId },
      data: { selfModelEntryId: entry.id },
    });

    // 如果选择了实验，同时创建 Experiment
    let experimentId: string | undefined;
    if (session.selectedExperiment) {
      const experiment = await this.prisma.experiment.create({
        data: {
          selfModelId: selfModel.id,
          description: session.selectedExperiment,
          sourceLensId: session.lensId,
          sourceLensName: session.lens.name,
          status: 'pending',
        },
      });
      experimentId = experiment.id;
    }

    // 更新 SelfModel 聚合缓存
    await this.updateSelfModelAggregates(selfModel.id);

    this.logger.info('Saved to SelfModel', {
      sessionId,
      entryId: entry.id,
      experimentId,
      userId: session.userId,
    });

    return { entryId: entry.id, experimentId };
  }

  /**
   * 更新 SelfModel 的聚合数据（top themes, top lenses 等）。
   */
  private async updateSelfModelAggregates(selfModelId: string): Promise<void> {
    const entries = await this.prisma.selfModelEntry.findMany({
      where: { selfModelId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 统计 top lenses
    const lensCounts: Record<string, { lensId: string; lensName: string; count: number }> = {};
    for (const entry of entries) {
      if (!lensCounts[entry.lensId]) {
        lensCounts[entry.lensId] = { lensId: entry.lensId, lensName: entry.lensName, count: 0 };
      }
      lensCounts[entry.lensId].count++;
    }
    const topLenses = Object.values(lensCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 统计重复主题（简单关键词提取）
    const themeKeywords = ['关系', '工作', '焦虑', '价值', '不配', '羞耻', '孤独', '意义', '压力', '恐惧'];
    const themeCounts: Record<string, number> = {};
    for (const entry of entries) {
      for (const keyword of themeKeywords) {
        if (entry.question.includes(keyword) || entry.newNarrative.includes(keyword)) {
          themeCounts[keyword] = (themeCounts[keyword] || 0) + 1;
        }
      }
    }
    const topThemes = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    await this.prisma.selfModel.update({
      where: { id: selfModelId },
      data: {
        topLenses: topLenses as unknown as any,
        topThemes: topThemes as unknown as any,
      },
    });
  }

  /**
   * 获取用户的所有 Exploration Sessions。
   */
  async listUserSessions(userId: string): Promise<ExplorationSessionResponse[]> {
    const sessions = await this.prisma.explorationSession.findMany({
      where: { userId },
      include: {
        lens: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => this.toSessionResponse(s));
  }

  private lensDefToCreateInput(lensDef: LensDefinition, userId: string): any {
    return {
      id: lensDef.id,
      name: lensDef.name,
      shortDescription: lensDef.shortDescription,
      sees: lensDef.sees,
      ignores: lensDef.ignores,
      explainsPainAs: lensDef.explainsPainAs,
      coreQuestions: lensDef.coreQuestions,
      explorationMoves: lensDef.explorationMoves,
      risks: lensDef.risks,
      domains: [],
      safetyBoundary: [],
      visibility: 'private',
      status: 'active',
      authorId: userId,
    };
  }

  private toSessionResponse(
    session: any,
  ): ExplorationSessionResponse {
    return {
      id: session.id,
      userId: session.userId,
      lensId: session.lensId,
      lensName: session.lens.name,
      originalQuestion: session.originalQuestion,
      phase: session.phase as ExplorationPhase,
      clarifiedQuestion: session.clarifiedQuestion,
      identifiedSignals: session.identifiedSignals,
      hypothesis: session.hypothesis,
      userValidation: session.userValidation,
      revisedHypothesis: session.revisedHypothesis,
      newNarrative: session.newNarrative,
      selectedExperiment: session.selectedExperiment,
      messages: session.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        phase: m.phase,
        createdAt: m.createdAt,
      })),
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    };
  }
}
