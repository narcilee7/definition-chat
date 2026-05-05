import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateExperimentRequest {
  selfModelId: string;
  description: string;
  sourceLensId: string;
  sourceLensName?: string;
}

export interface UpdateExperimentRequest {
  status?: 'pending' | 'active' | 'completed' | 'dropped';
  reflection?: string;
}

@Injectable()
export class SelfModelService {
  private readonly logger = createLogger('SelfModelService');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取或创建用户的 Self Model。
   */
  async getOrCreate(userId: string) {
    let selfModel = await this.prisma.selfModel.findUnique({
      where: { userId },
      include: {
        entries: { orderBy: { createdAt: 'desc' } },
        experiments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!selfModel) {
      selfModel = await this.prisma.selfModel.create({
        data: { userId },
        include: {
          entries: true,
          experiments: true,
        },
      });
    }

    return selfModel;
  }

  /**
   * 获取 Self Model 概览（用于 /model 首页）。
   */
  async getOverview(userId: string) {
    const selfModel = await this.getOrCreate(userId);

    const recentEntries = selfModel.entries.slice(0, 5);
    const activeExperiments = selfModel.experiments.filter((e) => e.status === 'active' || e.status === 'pending');
    const completedExperiments = selfModel.experiments.filter((e) => e.status === 'completed');

    return {
      id: selfModel.id,
      userId: selfModel.userId,
      topThemes: (selfModel.topThemes as any[]) || [],
      topLenses: (selfModel.topLenses as any[]) || [],
      recurringPatterns: (selfModel.recurringPatterns as any[]) || [],
      stats: {
        totalEntries: selfModel.entries.length,
        totalExperiments: selfModel.experiments.length,
        activeExperiments: activeExperiments.length,
        completedExperiments: completedExperiments.length,
      },
      recentEntries: recentEntries.map((e) => ({
        id: e.id,
        entryType: e.entryType,
        originalNarrative: e.originalNarrative,
        newNarrative: e.newNarrative,
        lensName: e.lensName,
        question: e.question,
        createdAt: e.createdAt,
      })),
      activeExperiments: activeExperiments.map((e) => ({
        id: e.id,
        description: e.description,
        sourceLensName: e.sourceLensName,
        status: e.status,
        startedAt: e.startedAt,
      })),
    };
  }

  /**
   * 获取所有 Entries（支持按类型筛选）。
   */
  async listEntries(userId: string, filters?: { entryType?: string; lensId?: string }) {
    const selfModel = await this.getOrCreate(userId);

    let entries = selfModel.entries;

    if (filters?.entryType) {
      entries = entries.filter((e) => e.entryType === filters.entryType);
    }

    if (filters?.lensId) {
      entries = entries.filter((e) => e.lensId === filters.lensId);
    }

    return entries;
  }

  /**
   * 获取单个 Entry。
   */
  async getEntry(entryId: string) {
    return this.prisma.selfModelEntry.findUnique({
      where: { id: entryId },
    });
  }

  /**
   * 更新 Entry（用户可手动编辑新解释、添加标签）。
   */
  async updateEntry(
    entryId: string,
    data: { newNarrative?: string; tags?: string[]; userEdited?: boolean },
  ) {
    const entry = await this.prisma.selfModelEntry.update({
      where: { id: entryId },
      data: {
        ...(data.newNarrative !== undefined && { newNarrative: data.newNarrative }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.userEdited !== undefined && { userEdited: data.userEdited }),
      },
    });

    this.logger.info('SelfModelEntry updated', { entryId });
    return entry;
  }

  /**
   * 删除 Entry。
   */
  async deleteEntry(entryId: string) {
    await this.prisma.selfModelEntry.delete({
      where: { id: entryId },
    });

    this.logger.info('SelfModelEntry deleted', { entryId });
    return { success: true };
  }

  /**
   * 创建实验。
   */
  async createExperiment(data: CreateExperimentRequest) {
    const experiment = await this.prisma.experiment.create({
      data: {
        selfModelId: data.selfModelId,
        description: data.description,
        sourceLensId: data.sourceLensId,
        sourceLensName: data.sourceLensName,
        status: 'pending',
      },
    });

    this.logger.info('Experiment created', { experimentId: experiment.id });
    return experiment;
  }

  /**
   * 获取实验列表。
   */
  async listExperiments(userId: string, status?: string) {
    const selfModel = await this.getOrCreate(userId);

    let experiments = selfModel.experiments;
    if (status) {
      experiments = experiments.filter((e) => e.status === status);
    }

    return experiments;
  }

  /**
   * 更新实验状态。
   */
  async updateExperiment(experimentId: string, data: UpdateExperimentRequest) {
    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'active' && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }
      if (data.status === 'completed' || data.status === 'dropped') {
        updateData.completedAt = new Date();
      }
    }

    if (data.reflection !== undefined) {
      updateData.reflection = data.reflection;
    }

    const experiment = await this.prisma.experiment.update({
      where: { id: experimentId },
      data: updateData,
    });

    this.logger.info('Experiment updated', { experimentId, status: data.status });
    return experiment;
  }

  /**
   * 生成 Insight Stream（轻量级洞察）。
   */
  async generateInsights(userId: string) {
    const selfModel = await this.getOrCreate(userId);
    const entries = selfModel.entries;
    const insights: Array<{
      type: string;
      title: string;
      description: string;
      action?: { label: string; href: string };
    }> = [];

    // 1. 检测重复主题
    const themeKeywords = ['关系', '工作', '焦虑', '价值', '不配', '羞耻', '孤独', '意义', '压力', '恐惧', '不够好'];
    const themeCounts: Record<string, number> = {};
    for (const entry of entries) {
      for (const keyword of themeKeywords) {
        const text = `${entry.question} ${entry.newNarrative}`;
        if (text.includes(keyword)) {
          themeCounts[keyword] = (themeCounts[keyword] || 0) + 1;
        }
      }
    }

    for (const [theme, count] of Object.entries(themeCounts)) {
      if (count >= 3) {
        insights.push({
          type: 'recurring_theme',
          title: `你反复在探索："${theme}"`,
          description: `这个主题在你的探索中出现了 ${count} 次。`,
          action: {
            label: '查看相关解释',
            href: `/model/narratives?keyword=${encodeURIComponent(theme)}`,
          },
        });
      }
    }

    // 2. 检测叙事转变
    const shifts = this.detectNarrativeShifts(entries);
    for (const shift of shifts) {
      insights.push({
        type: 'narrative_shift',
        title: '你的叙事发生了转变',
        description: `从"${shift.old}"到"${shift.new}"`,
        action: {
          label: '查看转变',
          href: `/model/narratives`,
        },
      });
    }

    // 3. Lens 使用建议
    const usedLensIds = new Set(entries.map((e) => e.lensId));
    const builtinLenses = [
      { id: 'cognitive-judgment', name: '认知判断 Lens', domains: '自动判断、证据检验' },
      { id: 'relationship-pattern', name: '关系模式 Lens', domains: '亲密关系、依恋' },
      { id: 'shame', name: '羞耻 Lens', domains: '不配得感、自我否定' },
      { id: 'values', name: '价值 Lens', domains: '意义、选择' },
      { id: 'body-signal', name: '身体信号 Lens', domains: '身体感受、边界' },
      { id: 'social-context', name: '社会处境 Lens', domains: '职业压力、社会比较' },
    ];
    const unused = builtinLenses.find((l) => !usedLensIds.has(l.id));
    if (unused && entries.length >= 2) {
      insights.push({
        type: 'lens_suggestion',
        title: `试试 ${unused.name}？`,
        description: `你还没用过这个 Lens，它擅长看见 ${unused.domains}。`,
        action: {
          label: '去试试',
          href: `/?suggestedLens=${unused.id}`,
        },
      });
    }

    return insights.slice(0, 3);
  }

  private detectNarrativeShifts(entries: any[]) {
    const shifts: Array<{ old: string; new: string }> = [];
    // 简单启发式：找同一个关键词但叙事方向不同的 entry
    const keywords = ['不配', '不够好', '害怕', '总是'];
    for (const keyword of keywords) {
      const related = entries.filter((e) =>
        e.originalNarrative?.includes(keyword) || e.newNarrative?.includes(keyword),
      );
      if (related.length >= 2) {
        const first = related[related.length - 1]; // 最早的
        const last = related[0]; // 最新的
        if (first.newNarrative && last.newNarrative && first.newNarrative !== last.newNarrative) {
          shifts.push({ old: first.newNarrative, new: last.newNarrative });
        }
      }
    }
    return shifts.slice(0, 2);
  }
}
