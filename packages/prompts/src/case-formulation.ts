/**
 * OhMe Prompt System — Layer 3: 个案概念化注入
 *
 * 将动态更新的个案概念化注入到 system prompt 中。
 * 这是治疗引擎的"记忆"——AI 对来访者的临床理解。
 */

export interface CaseFormulationContext {
  presentingProblems: string;
  triggers?: string | null;
  thoughts?: string | null;
  emotions?: string | null;
  behaviors?: string | null;
  physical?: string | null;
  coreBeliefs: string[];
  intermediateBeliefs: string[];
  copingStrategies: string[];
  formativeEvents?: string | null;
  treatmentGoals: Array<{
    goal: string;
    timeframe: string;
    measures?: string[];
  }>;
  confidence: number;
  version: number;
}

export function buildCaseFormulationContext(ctx: CaseFormulationContext): string {
  if (ctx.confidence < 0.3) {
    return `【个案概念化】尚未建立。来访者刚完成 intake 评估，需要进一步探索。`;
  }

  const parts: string[] = [];

  parts.push(`【个案概念化 v${ctx.version}】（仅供参考，不要向来访者透露）`);
  parts.push(`主诉：${ctx.presentingProblems}`);

  // Five-Factor Model
  const hasFiveFactor = ctx.triggers || ctx.thoughts || ctx.emotions || ctx.behaviors || ctx.physical;
  if (hasFiveFactor) {
    parts.push(`\n维持循环：`);
    if (ctx.triggers) parts.push(`- 诱发情境：${ctx.triggers}`);
    if (ctx.thoughts) parts.push(`- 自动思维：${ctx.thoughts}`);
    if (ctx.emotions) parts.push(`- 核心情绪：${ctx.emotions}`);
    if (ctx.behaviors) parts.push(`- 维持行为：${ctx.behaviors}`);
    if (ctx.physical) parts.push(`- 身体反应：${ctx.physical}`);
  }

  // Deep Structure
  if (ctx.coreBeliefs.length > 0 || ctx.intermediateBeliefs.length > 0) {
    parts.push(`\n深层结构：`);
    if (ctx.coreBeliefs.length > 0) parts.push(`- 核心信念：${ctx.coreBeliefs.join('、')}`);
    if (ctx.intermediateBeliefs.length > 0) parts.push(`- 中间信念：${ctx.intermediateBeliefs.join('、')}`);
    if (ctx.copingStrategies.length > 0) parts.push(`- 应对策略：${ctx.copingStrategies.join('、')}`);
  }

  if (ctx.formativeEvents) {
    parts.push(`\n发展历史：${ctx.formativeEvents}`);
  }

  // Treatment Goals
  if (ctx.treatmentGoals.length > 0) {
    parts.push(`\n治疗目标：`);
    ctx.treatmentGoals.forEach((g, i) => {
      const measures = g.measures ? `（衡量：${g.measures.join('、')}）` : '';
      parts.push(`${i + 1}. ${g.goal}（${g.timeframe}）${measures}`);
    });
  }

  // Current Focus
  if (ctx.treatmentGoals.length > 0) {
    parts.push(`\n当前重点：${ctx.treatmentGoals[0].goal}`);
  }

  parts.push(`\n概念化置信度：${Math.round(ctx.confidence * 100)}%`);

  return parts.join('\n');
}
