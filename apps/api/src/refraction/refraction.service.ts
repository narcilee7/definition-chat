import { Injectable } from '@nestjs/common';
import { createLogger } from '@ohme/observability';
import { LLMFallbackService } from '../llm/llm-fallback.service';
import { findLens, LENSES, LensDefinition } from '../lenses/lens-definitions';

export interface RefractionRequest {
  userId: string;
  question: string;
  lensIds?: string[];
  approachIds?: string[];
}

export interface RefractionResult {
  lensId: string;
  lensName: string;
  content: string;
  latencyMs: number;
}

@Injectable()
export class RefractionService {
  private readonly logger = createLogger('RefractionService');

  constructor(private llm: LLMFallbackService) {}

  async refract(data: RefractionRequest): Promise<RefractionResult[]> {
    const { userId, question } = data;
    const selectedIds = data.lensIds ?? data.approachIds ?? ['cognitive-judgment', 'relationship-pattern', 'values'];
    const selectedLenses = selectedIds
      .map((id) => findLens(id))
      .filter((lens): lens is LensDefinition => Boolean(lens));

    const lenses = selectedLenses.length > 0 ? selectedLenses : LENSES.slice(0, 3);

    const results = await Promise.all(
      lenses.map(async (lens) => {
        const start = Date.now();

        try {
          const response = await this.llm.chat(
            [
              { role: 'system', content: this.buildLensPrompt(lens) },
              { role: 'user', content: question },
            ],
            { temperature: 0.65, maxTokens: 700 },
          );

          return {
            lensId: lens.id,
            lensName: lens.name,
            content: response.content.trim(),
            latencyMs: Date.now() - start,
          };
        } catch (error) {
          this.logger.error('Lens refraction failed', { lens: lens.id, error });
          return {
            lensId: lens.id,
            lensName: lens.name,
            content: '这个 Lens 暂时没有完成折射。你可以稍后重试，或先换一个视角看这件事。',
            latencyMs: Date.now() - start,
          };
        }
      }),
    );

    this.logger.info('Lens refraction completed', {
      userId,
      lensCount: lenses.length,
    });

    return results;
  }

  private buildLensPrompt(lens: LensDefinition): string {
    return `你是 OhMe 的一个 Lens，不是医生、咨询师或人生导师。

Lens 名称：${lens.name}
Lens 描述：${lens.shortDescription}

你天然会看见：
${lens.sees.map((item) => `- ${item}`).join('\n')}

你容易忽略：
${lens.ignores.map((item) => `- ${item}`).join('\n')}

你如何解释痛苦：
${lens.explainsPainAs}

你常用的问题：
${lens.coreQuestions.map((item) => `- ${item}`).join('\n')}

你常用的探索动作：
${lens.explorationMoves.map((item) => `- ${item}`).join('\n')}

风险边界：
${lens.risks.map((item) => `- ${item}`).join('\n')}

任务：用户会给你一个困扰。请只从这个 Lens 出发折射它。

输出必须使用下面 5 个小标题，不要增删标题：

理解
用 1-2 句话说明这个 Lens 如何理解该问题。不要下诊断。

看见
列出 2-3 个这个 Lens 看见的信号。

盲区
用 1 句话提醒这个 Lens 可能忽略什么。

关键问题
只提出 1 个最值得用户继续看的问题。

小探索动作
给出 1 个轻量、非医疗、可在今天完成的探索动作。

风格要求：克制、清晰、有洞察；不鸡汤；不说“你应该”；不承诺疗效；总长度不超过 260 字。`;
  }
}
