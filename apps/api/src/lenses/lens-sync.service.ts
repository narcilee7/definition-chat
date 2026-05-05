import { Injectable, OnModuleInit } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { PrismaService } from '../prisma/prisma.service';
import { LENSES } from './lens-definitions';

/**
 * 在应用启动时，将内置 Lens 定义同步到数据库。
 * 使用 upsert 保证幂等性：已存在则更新，不存在则创建。
 */
@Injectable()
export class LensSyncService implements OnModuleInit {
  private readonly logger = createLogger('LensSyncService');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.syncBuiltInLenses();
  }

  private async syncBuiltInLenses() {
    this.logger.info('Syncing built-in lenses to database...');

    for (const lens of LENSES) {
      await this.prisma.lens.upsert({
        where: { id: lens.id },
        update: {
          name: lens.name,
          shortDescription: lens.shortDescription,
          sees: lens.sees,
          ignores: lens.ignores,
          explainsPainAs: lens.explainsPainAs,
          coreQuestions: lens.coreQuestions,
          explorationMoves: lens.explorationMoves,
          risks: lens.risks,
          domains: this.inferDomains(lens.id),
          safetyBoundary: [],
          visibility: 'public',
          status: 'active',
        },
        create: {
          id: lens.id,
          name: lens.name,
          shortDescription: lens.shortDescription,
          sees: lens.sees,
          ignores: lens.ignores,
          explainsPainAs: lens.explainsPainAs,
          coreQuestions: lens.coreQuestions,
          explorationMoves: lens.explorationMoves,
          risks: lens.risks,
          domains: this.inferDomains(lens.id),
          safetyBoundary: [],
          visibility: 'public',
          status: 'active',
        },
      });
    }

    this.logger.info('Built-in lenses synced', { count: LENSES.length });
  }

  private inferDomains(lensId: string): string[] {
    const domainMap: Record<string, string[]> = {
      'cognitive-judgment': ['自动判断', '证据检验', '情绪推理'],
      'relationship-pattern': ['亲密关系', '依恋', '旧模式'],
      'shame': ['不配得感', '自我否定', '暴露恐惧'],
      'values': ['意义', '选择', '承诺行动'],
      'body-signal': ['身体感受', '边界', '压力反应'],
      'social-context': ['职业压力', '社会比较', '结构处境'],
    };
    return domainMap[lensId] || [];
  }
}
