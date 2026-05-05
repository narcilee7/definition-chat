import { Injectable } from '@nestjs/common';
import { LLMFallbackService } from '../llm/llm-fallback.service';
import { findLens, LensDefinition, normalizeLens } from '../lenses/lens-definitions';

export interface ExploreRequest {
  lensId: string;
  question: string;
  userResponse?: string;
  hypothesis?: string;
  customLens?: unknown;
}

export interface ExploreResponse {
  lensId: string;
  lensName: string;
  mode: 'start' | 'complete';
  content: string;
  latencyMs: number;
}

@Injectable()
export class ExploreService {
  constructor(private llm: LLMFallbackService) {}

  async explore(data: ExploreRequest): Promise<ExploreResponse> {
    const customLens = normalizeLens(data.customLens);
    const lens = customLens?.id === data.lensId ? customLens : findLens(data.lensId) ?? findLens('cognitive-judgment');
    if (!lens) {
      throw new Error('No Lens available');
    }

    const start = Date.now();
    const mode = data.userResponse?.trim() ? 'complete' : 'start';
    const content = mode === 'start'
      ? await this.startExploration(lens, data.question)
      : await this.completeExploration(lens, data.question, data.userResponse ?? '', data.hypothesis ?? '');

    return {
      lensId: lens.id,
      lensName: lens.name,
      mode,
      content: content.trim(),
      latencyMs: Date.now() - start,
    };
  }

  private async startExploration(lens: LensDefinition, question: string): Promise<string> {
    const response = await this.llm.chat(
      [
        { role: 'system', content: this.basePrompt(lens) + this.startPrompt() },
        { role: 'user', content: question },
      ],
      { temperature: 0.62, maxTokens: 650 },
    );

    return response.content;
  }

  private async completeExploration(
    lens: LensDefinition,
    question: string,
    userResponse: string,
    hypothesis: string,
  ): Promise<string> {
    const response = await this.llm.chat(
      [
        { role: 'system', content: this.basePrompt(lens) + this.completePrompt() },
        {
          role: 'user',
          content: `原问题：${question}\n\n上一轮解释假设：${hypothesis || '无'}\n\n用户回应：${userResponse}`,
        },
      ],
      { temperature: 0.62, maxTokens: 700 },
    );

    return response.content;
  }

  private basePrompt(lens: LensDefinition): string {
    return `你是 OhMe 的一个 Lens，不是医生、咨询师或人生导师。

Lens 名称：${lens.name}
Lens 描述：${lens.shortDescription}

你会看见：
${lens.sees.map((item) => `- ${item}`).join('\n')}

你容易忽略：
${lens.ignores.map((item) => `- ${item}`).join('\n')}

你如何解释痛苦：
${lens.explainsPainAs}

风险边界：
${lens.risks.map((item) => `- ${item}`).join('\n')}

共同要求：
- 不诊断，不承诺疗效，不扮演咨询师。
- 不说“你应该”。
- 把你的解释当作假设，而不是真理。
- 语言克制、清晰、有洞察，总长度不超过 260 字。
`;
  }

  private startPrompt(): string {
    return `
任务：用户给出一个困扰。请启动结构化深潜的第一步。

输出必须使用这 3 个标题：

解释假设
用 2-3 句话提出一个可被用户确认或修正的解释假设。

我想确认
只问 1 个关键问题，帮助用户确认或修正这个解释。

请你回应
给用户一个很具体的回应入口，例如“你可以从一个最近发生的场景说起”。`;
  }

  private completePrompt(): string {
    return `
任务：根据用户对解释假设的回应，生成本轮探索的收束。

输出必须使用这 3 个标题：

新的自我解释
用一句更准确、更不自我审判的话，帮用户重写原问题。

为什么它更准确
用 2-3 句话说明这个新解释如何吸收了用户的回应。

一个小实验
给出 1 个今天或本周可完成的小实验。它必须轻量、非医疗、可观察。`;
  }
}
