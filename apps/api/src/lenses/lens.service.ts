import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateLensRequest {
  name: string;
  shortDescription: string;
  description?: string;
  domains: string[];
  sees: string[];
  ignores: string[];
  explainsPainAs: string;
  coreQuestions: string[];
  explorationMoves: string[];
  risks: string[];
  safetyBoundary?: string[];
  tone?: { style?: string; temperature?: number; constraints?: string[] };
  authorId: string;
  authorName?: string;
  forkedFrom?: string;
  visibility?: 'public' | 'unlisted' | 'private';
}

export interface UpdateLensRequest {
  name?: string;
  shortDescription?: string;
  description?: string;
  domains?: string[];
  sees?: string[];
  ignores?: string[];
  explainsPainAs?: string;
  coreQuestions?: string[];
  explorationMoves?: string[];
  risks?: string[];
  safetyBoundary?: string[];
  tone?: { style?: string; temperature?: number; constraints?: string[] };
  visibility?: 'public' | 'unlisted' | 'private';
}

@Injectable()
export class LensService {
  private readonly logger = createLogger('LensService');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建 Lens。
   */
  async create(data: CreateLensRequest) {
    const lens = await this.prisma.lens.create({
      data: {
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        domains: data.domains,
        sees: data.sees,
        ignores: data.ignores,
        explainsPainAs: data.explainsPainAs,
        coreQuestions: data.coreQuestions,
        explorationMoves: data.explorationMoves,
        risks: data.risks,
        safetyBoundary: data.safetyBoundary || [],
        tone: data.tone as any,
        authorId: data.authorId,
        authorName: data.authorName,
        forkedFrom: data.forkedFrom,
        visibility: data.visibility || 'private',
        status: 'active',
      },
    });

    // 如果是 Fork，更新原 Lens 的 forkCount
    if (data.forkedFrom) {
      await this.prisma.lens.update({
        where: { id: data.forkedFrom },
        data: { forkCount: { increment: 1 } },
      });
    }

    this.logger.info('Lens created', { lensId: lens.id, authorId: data.authorId });
    return lens;
  }

  /**
   * 获取 Lens 详情。
   */
  async findById(id: string) {
    return this.prisma.lens.findUnique({ where: { id } });
  }

  /**
   * 更新 Lens。
   */
  async update(id: string, data: UpdateLensRequest, userId: string) {
    const lens = await this.prisma.lens.findUnique({ where: { id } });
    if (!lens) throw new Error('Lens not found');
    if (lens.authorId !== userId) throw new Error('Not authorized');

    const updated = await this.prisma.lens.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.domains !== undefined && { domains: data.domains }),
        ...(data.sees !== undefined && { sees: data.sees }),
        ...(data.ignores !== undefined && { ignores: data.ignores }),
        ...(data.explainsPainAs !== undefined && { explainsPainAs: data.explainsPainAs }),
        ...(data.coreQuestions !== undefined && { coreQuestions: data.coreQuestions }),
        ...(data.explorationMoves !== undefined && { explorationMoves: data.explorationMoves }),
        ...(data.risks !== undefined && { risks: data.risks }),
        ...(data.safetyBoundary !== undefined && { safetyBoundary: data.safetyBoundary }),
        ...(data.tone !== undefined && { tone: data.tone as any }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
      },
    });

    this.logger.info('Lens updated', { lensId: id });
    return updated;
  }

  /**
   * 删除 Lens。
   */
  async delete(id: string, userId: string) {
    const lens = await this.prisma.lens.findUnique({ where: { id } });
    if (!lens) throw new Error('Lens not found');
    if (lens.authorId !== userId) throw new Error('Not authorized');

    await this.prisma.lens.update({
      where: { id },
      data: { status: 'deprecated' },
    });

    this.logger.info('Lens deprecated', { lensId: id });
    return { success: true };
  }

  /**
   * 列表查询（Market 发现页）。
   */
  async list(options: {
    visibility?: string;
    authorId?: string;
    status?: string;
    query?: string;
    sortBy?: 'popular' | 'recent' | 'rating';
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      visibility = 'public',
      authorId,
      status = 'active',
      query,
      sortBy = 'popular',
      limit = 20,
      offset = 0,
    } = options;

    const where: any = {};

    if (visibility) where.visibility = visibility;
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { shortDescription: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const orderBy: any =
      sortBy === 'popular'
        ? { useCount: 'desc' }
        : sortBy === 'recent'
          ? { createdAt: 'desc' }
          : { avgRating: 'desc' };

    const [lenses, total] = await Promise.all([
      this.prisma.lens.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.prisma.lens.count({ where }),
    ]);

    return { lenses, total, limit, offset };
  }

  /**
   * Fork Lens。
   */
  async fork(lensId: string, userId: string, userName?: string) {
    const original = await this.prisma.lens.findUnique({ where: { id: lensId } });
    if (!original) throw new Error('Lens not found');

    const forked = await this.prisma.lens.create({
      data: {
        name: `${original.name.replace(/\s*Lens$/, '')} Fork Lens`,
        shortDescription: original.shortDescription,
        description: original.description,
        domains: original.domains,
        sees: original.sees,
        ignores: original.ignores,
        explainsPainAs: original.explainsPainAs,
        coreQuestions: original.coreQuestions,
        explorationMoves: original.explorationMoves,
        risks: original.risks,
        safetyBoundary: original.safetyBoundary,
        tone: original.tone as any,
        authorId: userId,
        authorName: userName,
        forkedFrom: original.id,
        visibility: 'private',
        status: 'active',
      },
    });

    await this.prisma.lens.update({
      where: { id: lensId },
      data: { forkCount: { increment: 1 } },
    });

    this.logger.info('Lens forked', { originalId: lensId, forkId: forked.id });
    return forked;
  }

  /**
   * 记录 Lens 使用（useCount + 1）。
   */
  async recordUse(lensId: string) {
    await this.prisma.lens.update({
      where: { id: lensId },
      data: { useCount: { increment: 1 } },
    });
  }
}
