import { LLMFallbackService } from '../llm/llm-fallback.service';
import { LensDefinition } from '../lenses/lens-definitions';
import { PrismaService } from '../prisma/prisma.service';

export type ExplorationPhase =
  | 'clarify'
  | 'identify'
  | 'hypothesize'
  | 'validate'
  | 'reframe'
  | 'experiment'
  | 'complete';

const PHASE_FLOW: ExplorationPhase[] = [
  'clarify',
  'identify',
  'hypothesize',
  'validate',
  'reframe',
  'experiment',
  'complete',
];

export function getNextPhase(current: ExplorationPhase): ExplorationPhase {
  const idx = PHASE_FLOW.indexOf(current);
  return PHASE_FLOW[idx + 1] ?? 'complete';
}

export interface PhasePromptContext {
  lens: LensDefinition;
  originalQuestion: string;
  clarifiedQuestion?: string | null;
  identifiedSignals?: string[] | null;
  hypothesis?: string | null;
  userValidation?: string | null;
  revisedHypothesis?: string | null;
  newNarrative?: string | null;
  selectedExperiment?: string | null;
}

export interface PhaseResult {
  content: string;
  fieldUpdates: Partial<Record<keyof PhasePromptContext, unknown>>;
  shouldAdvance: boolean;
}

/**
 * Exploration 状态机核心。
 * 负责：构建阶段 Prompt → 调用 LLM → 解析产出 → 决定阶段推进。
 */
export class ExplorationStateMachine {
  constructor(
    private readonly llm: LLMFallbackService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 处理用户在当前阶段的输入，返回 Lens 回复 + 阶段更新信息。
   */
  async process(
    sessionId: string,
    userInput: string,
  ): Promise<{
    lensReply: string;
    nextPhase: ExplorationPhase;
    fieldUpdates: Partial<Record<keyof PhasePromptContext, unknown>>;
  }> {
    const session = await this.prisma.explorationSession.findUnique({
      where: { id: sessionId },
      include: { lens: true },
    });

    if (!session) {
      throw new Error(`ExplorationSession not found: ${sessionId}`);
    }

    const lens: LensDefinition = {
      id: session.lens.id,
      name: session.lens.name,
      shortDescription: session.lens.shortDescription,
      sees: session.lens.sees,
      ignores: session.lens.ignores,
      explainsPainAs: session.lens.explainsPainAs,
      coreQuestions: session.lens.coreQuestions,
      explorationMoves: session.lens.explorationMoves,
      risks: session.lens.risks,
    };

    const context: PhasePromptContext = {
      lens,
      originalQuestion: session.originalQuestion,
      clarifiedQuestion: session.clarifiedQuestion,
      identifiedSignals: session.identifiedSignals,
      hypothesis: session.hypothesis,
      userValidation: session.userValidation,
      revisedHypothesis: session.revisedHypothesis,
      newNarrative: session.newNarrative,
      selectedExperiment: session.selectedExperiment,
    };

    const currentPhase = session.phase as ExplorationPhase;

    // 保存用户消息
    await this.prisma.explorationMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: userInput,
        phase: currentPhase,
        metadata: {},
      },
    });

    // 获取历史消息（最近 10 条，作为上下文）
    const history = await this.prisma.explorationMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // 调用 LLM
    const start = Date.now();
    const { content: lensReply, shouldAdvance, fieldUpdates } = await this.callPhaseLLM(
      currentPhase,
      context,
      userInput,
      history,
    );

    // 保存 Lens 消息
    await this.prisma.explorationMessage.create({
      data: {
        sessionId,
        role: 'lens',
        content: lensReply,
        phase: currentPhase,
        metadata: { latencyMs: Date.now() - start, shouldAdvance },
      },
    });

    const nextPhase = shouldAdvance ? getNextPhase(currentPhase) : currentPhase;

    return {
      lensReply,
      nextPhase,
      fieldUpdates,
    };
  }

  private async callPhaseLLM(
    phase: ExplorationPhase,
    ctx: PhasePromptContext,
    userInput: string,
    history: Array<{ role: string; content: string; phase: string }>,
  ): Promise<PhaseResult> {
    const systemPrompt = this.buildSystemPrompt(ctx);
    const phaseInstruction = this.buildPhaseInstruction(phase, ctx);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt + '\n\n' + phaseInstruction },
    ];

    // 注入历史（只注入当前阶段的历史，避免上下文过长）
    for (const msg of history.filter((h) => h.phase === phase || h.phase === 'system')) {
      messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }

    // 当前用户输入
    messages.push({ role: 'user', content: userInput });

    const response = await this.llm.chat(messages, { temperature: 0.65, maxTokens: 800 });
    const content = response.content.trim();

    // 解析阶段产出
    return this.parsePhaseResult(phase, content, userInput);
  }

  private buildSystemPrompt(ctx: PhasePromptContext): string {
    const lens = ctx.lens;
    return `你是 OhMe 的一个 Lens，不是医生、咨询师或人生导师。

Lens 名称：${lens.name}
Lens 描述：${lens.shortDescription}

你会看见：
${lens.sees.map((item) => `- ${item}`).join('\n')}

你容易忽略：
${lens.ignores.map((item) => `- ${item}`).join('\n')}

你如何解释痛苦：
${lens.explainsPainAs}

核心问题：
${lens.coreQuestions.map((item) => `- ${item}`).join('\n')}

探索动作：
${lens.explorationMoves.map((item) => `- ${item}`).join('\n')}

风险边界：
${lens.risks.map((item) => `- ${item}`).join('\n')}

全局约束：
- 明确自己只是一个视角，不是真理。
- 克制、清晰、有洞察；不鸡汤；不说"你应该"。
- 用问题推动用户确认或修正，而不是下结论。
- 总长度不超过 300 字。`;
  }

  private buildPhaseInstruction(phase: ExplorationPhase, ctx: PhasePromptContext): string {
    const base = `用户的原始问题：${ctx.originalQuestion}`;

    switch (phase) {
      case 'clarify':
        return `${base}

【当前阶段：澄清问题】
你的目标是确认你理解的问题是否准确。用 1-2 个问题帮助用户澄清或确认。

输出要求：
1. 先简要重述你对问题的理解（1 句话）。
2. 然后问 1-2 个澄清问题。
3. 如果已经够清楚了，可以说"我已经理解了"，并自动推进。`;

      case 'identify':
        return `${base}
已澄清的问题：${ctx.clarifiedQuestion || ctx.originalQuestion}

【当前阶段：识别核心信号】
引导用户标记该问题中最关键的 2-3 个信号。你可以给出候选信号，让用户确认或补充。

输出要求：
1. 列出 2-3 个你看见的候选信号。
2. 请用户确认哪些最准，或补充新的。
3. 语气是邀请式的，不是诊断式的。`;

      case 'hypothesize':
        return `${base}
已澄清的问题：${ctx.clarifiedQuestion || ctx.originalQuestion}
已识别的信号：${(ctx.identifiedSignals || []).join('、')}

【当前阶段：提出解释假设】
基于前面的澄清和信号，提出一个可检验的解释假设。这是你的核心视角介入。

输出要求：
1. 用 2-3 句话提出解释假设。
2. 明确说明"这只是这个 Lens 的视角"。
3. 邀请用户确认（"这符合你的经验吗？"）或修正（"如果不对，哪里需要调整？"）。`;

      case 'validate':
        return `${base}
已澄清的问题：${ctx.clarifiedQuestion || ctx.originalQuestion}
已识别的信号：${(ctx.identifiedSignals || []).join('、')}
提出的假设：${ctx.hypothesis || '（暂无）'}

用户的回应：${ctx.userValidation || '（等待用户输入）'}

【当前阶段：确认/修正假设】
根据用户的确认或修正，更新你的假设。如果用户说"对"，就深化；如果用户说"不完全对"，就修正。

输出要求：
1. 先回应用户的确认或修正（1 句话）。
2. 给出修正后的假设（如果需要）。
3. 确认"我们现在聚焦在这个理解上"，准备进入下一阶段。`;

      case 'reframe':
        return `${base}
已澄清的问题：${ctx.clarifiedQuestion || ctx.originalQuestion}
已识别的信号：${(ctx.identifiedSignals || []).join('、')}
最终假设：${ctx.revisedHypothesis || ctx.hypothesis || '（暂无）'}

【当前阶段：生成新解释】
帮用户生成一句比原问题更准确的自我描述。这是深潜的核心产物。

输出要求：
1. 用一句简洁、有力、不自我审判的话，帮用户重写原问题。
2. 解释为什么这个新解释更准确（2-3 句话）。
3. 邀请用户微调这句话，直到他们觉得"这就是我想说的"。`;

      case 'experiment':
        return `${base}
用户的原问题：${ctx.originalQuestion}
新的自我解释：${ctx.newNarrative || '（暂无）'}

【当前阶段：选择小实验】
基于新的自我解释，提出 1-3 个轻量、非医疗、可观察的小实验。用户选一个。

输出要求：
1. 简要肯定用户的新解释（1 句话）。
2. 提出 1-3 个实验选项，每个一句话描述。
3. 请用户选一个，或提出自己的实验。
4. 实验必须：轻量、今天或本周可做、可观察结果。`;

      case 'complete':
        return `${base}
新的自我解释：${ctx.newNarrative || '（暂无）'}
选择的实验：${ctx.selectedExperiment || '（暂无）'}

【当前阶段：完成收束】
温和地结束这段深潜，总结收获，并告诉用户结果已保存到 Self Model。

输出要求：
1. 确认用户的收获（1 句话）。
2. 提醒实验的观察要点。
3. 告诉用户"这段探索已保存，你可以在 Self Model 中查看"。
4. 语气温暖但克制，不煽情。`;
    }
  }

  private parsePhaseResult(
    phase: ExplorationPhase,
    content: string,
    userInput: string,
  ): PhaseResult {
    // 默认：推进到下一阶段（简单启发式：如果 Lens 的回复包含明确的推进信号）
    const advanceKeywords = [
      '接下来',
      '进入',
      '下一阶段',
      '下一步',
      '准备好了',
      '我们继续',
    ];

    const shouldAdvance = advanceKeywords.some((kw) => content.includes(kw));

    const fieldUpdates: Partial<Record<keyof PhasePromptContext, unknown>> = {};

    // 简单的字段提取（基于阶段）
    switch (phase) {
      case 'clarify':
        // 提取澄清后的问题（取第一句话作为澄清问题）
        if (content.includes('。')) {
          const firstSentence = content.split('。')[0] + '。';
          if (firstSentence.length > 10 && firstSentence.length < 200) {
            fieldUpdates.clarifiedQuestion = firstSentence;
          }
        }
        break;

      case 'identify':
        // 提取信号（找列表项）
        const signals = content
          .split('\n')
          .filter((line) => /^[\d\-\*•]/.test(line.trim()))
          .map((line) => line.replace(/^[\d\-\*•]\.?\s*/, '').trim())
          .filter((s) => s.length > 0 && s.length < 100);
        if (signals.length > 0) {
          fieldUpdates.identifiedSignals = signals.slice(0, 5);
        }
        break;

      case 'hypothesize':
        // 提取假设（取第一个非列表的段落）
        const hypoLines = content.split('\n').filter((l) => l.trim().length > 0);
        const hypoCandidate = hypoLines.find((l) => !/^[\d\-\*•]/.test(l.trim()) && l.length > 20);
        if (hypoCandidate) {
          fieldUpdates.hypothesis = hypoCandidate.trim();
        }
        break;

      case 'validate':
        if (userInput.includes('对') || userInput.includes('是') || userInput.includes('没错')) {
          fieldUpdates.userValidation = 'confirmed';
        } else {
          fieldUpdates.userValidation = `revised: ${userInput}`;
        }
        // 尝试提取修正后的假设
        const revised = content.split('\n').find((l) => l.length > 20 && !/^[\d\-\*•]/.test(l.trim()));
        if (revised) {
          fieldUpdates.revisedHypothesis = revised.trim();
        }
        break;

      case 'reframe':
        // 提取新解释（找引号或第一行重点句子）
        const quoteMatch = content.match(/["""']([^"""']{10,200})["""']/);
        if (quoteMatch) {
          fieldUpdates.newNarrative = quoteMatch[1].trim();
        } else {
          const narrativeLine = content
            .split('\n')
            .find((l) => l.length > 15 && l.length < 200 && !/^[\d\-\*•]/.test(l.trim()));
          if (narrativeLine) {
            fieldUpdates.newNarrative = narrativeLine.trim();
          }
        }
        break;

      case 'experiment':
        // 提取实验（找列表项）
        const experiments = content
          .split('\n')
          .filter((line) => /^[\d\-\*•]/.test(line.trim()))
          .map((line) => line.replace(/^[\d\-\*•]\.?\s*/, '').trim())
          .filter((s) => s.length > 10 && s.length < 200);
        if (experiments.length > 0) {
          fieldUpdates.selectedExperiment = experiments[0];
        }
        break;
    }

    return {
      content,
      fieldUpdates,
      shouldAdvance: phase === 'complete' ? false : shouldAdvance || userInput.length > 5,
    };
  }
}
