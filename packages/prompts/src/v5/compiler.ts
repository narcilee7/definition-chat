/**
 * OhMe V5 — Prompt 编译器
 *
 * 将 V5 整合取向治疗师核心 Prompt 与动态信息组装成完整的 system prompt。
 *
 * V5 与 V2 五层编译器的区别：
 * - V2：Layer 1→2→3→4→5 拼接，结构感强但容易让 AI 感到"被组装"
 * - V5：一个统一的深度 Prompt + 动态注入块，更像一个完整的治疗师在"回忆"和"调整状态"
 */

import {
  V5_THERAPIST_CORE,
  buildV5PhaseAwareness,
  buildV5CaseFormulation,
  buildV5PersonaStyle,
  buildV5PreviousInsights,
  buildV5SkillsIntroduced,
} from './therapist';

/**
 * V5 编译器输入选项
 */
export interface V5CompileOptions {
  /** 会话序号 */
  sessionNumber: number;

  /** 来访者首次 presenting problem（首次会话用） */
  presentingProblem?: string;

  /** 当前会话阶段 */
  phase: string;

  /** 当前议程 */
  agenda?: Array<{ topic: string; priority: string; status: string }>;

  /** 作业回顾 */
  homeworkReview?: Array<{ task: string; completed: boolean }>;

  /** 上次会话摘要 */
  previousSessionSummary?: string;

  /** 个案概念化上下文 */
  caseFormulation?: {
    presentingProblems?: string;
    triggers?: string | null;
    thoughts?: string | null;
    emotions?: string | null;
    behaviors?: string | null;
    physical?: string | null;
    coreBeliefs?: string[];
    intermediateBeliefs?: string[];
    copingStrategies?: string[];
    formativeEvents?: string | null;
    treatmentGoals?: Array<{ goal: string; timeframe: string; measures?: string[] }>;
    confidence?: number;
    version?: number;
  };

  /** 咨询师人格风格 */
  persona?: {
    name: string;
    description?: string;
    voiceTone?: string;
    responseLength?: 'minimal' | 'concise' | 'moderate' | 'detailed';
    styleTraits?: {
      directness?: number;
      warmth?: number;
      structure?: number;
      depth?: number;
    };
    specialties?: string[];
  };

  /** 本次会话中已产生的洞察 */
  previousInsights?: string[];

  /** 已引入的技能 */
  skillsIntroduced?: string[];
}

/**
 * 编译 V5 System Prompt
 *
 * 组装顺序：
 * 1. 核心治疗师 Prompt（身份、姿态、技术库、质量标准）
 * 2. 人格风格注入（微调治疗师的"个性"）
 * 3. 个案概念化注入（治疗记忆）
 * 4. 会话阶段感知（当前状态）
 * 5. 历史洞察（本次会话的连续性）
 * 6. 已引入技能（工具箱提醒）
 */
export function compileV5SystemPrompt(options: V5CompileOptions): string {
  const sections: string[] = [];

  // Section 1: 核心治疗师身份
  sections.push(V5_THERAPIST_CORE);

  // Section 2: 人格风格（让治疗师有个性）
  if (options.persona) {
    sections.push(buildV5PersonaStyle(options.persona));
  }

  // Section 3: 个案概念化（治疗记忆）
  if (options.caseFormulation) {
    sections.push(buildV5CaseFormulation(options.caseFormulation));
  }

  // Section 4: 会话阶段感知（当前状态）
  sections.push(
    buildV5PhaseAwareness({
      phase: options.phase,
      sessionNumber: options.sessionNumber,
      agenda: options.agenda,
      homeworkReview: options.homeworkReview,
      previousSessionSummary: options.previousSessionSummary,
      presentingProblem: options.presentingProblem,
    }),
  );

  // Section 5: 历史洞察（本次会话连续性）
  if (options.previousInsights && options.previousInsights.length > 0) {
    sections.push(buildV5PreviousInsights(options.previousInsights));
  }

  // Section 6: 已引入技能
  if (options.skillsIntroduced && options.skillsIntroduced.length > 0) {
    sections.push(buildV5SkillsIntroduced(options.skillsIntroduced));
  }

  // 用分隔线连接，让 AI 能清晰区分不同部分
  return sections.join('\n\n══════════════════════════════════════\n\n');
}

/**
 * 估算 V5 Prompt 的 token 数量（粗略估计）
 */
export function estimateV5Tokens(text: string): number {
  // 粗略估计：中文字符 ≈ 1 token，英文单词 ≈ 0.75 token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = text.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.ceil(chineseChars + englishWords * 0.75);
}

/**
 * 如果 prompt 太长，智能压缩
 *
 * 压缩策略（按优先级降序）：
 * 1. 截断历史洞察（最不重要）
 * 2. 截断已引入技能
 * 3. 简化个案概念化（保留核心信念和治疗目标，截断维持循环细节）
 * 4. 截断上次会话摘要
 */
export function compressV5IfNeeded(prompt: string, maxTokens: number = 4000): string {
  const tokens = estimateV5Tokens(prompt);
  if (tokens <= maxTokens) return prompt;

  // 简单压缩策略：如果 prompt 过长，尝试移除一些较不关键的部分
  // 实际实现可以更智能，这里提供一个基础版本

  let compressed = prompt;

  // 尝试移除历史洞察部分（如果有）
  const insightsMarker = '【本次会话中的关键洞察】';
  if (compressed.includes(insightsMarker)) {
    const idx = compressed.indexOf(insightsMarker);
    const endIdx = compressed.indexOf('\n\n══════════════════════════════════════\n\n', idx);
    if (endIdx > idx) {
      compressed = compressed.slice(0, idx) + compressed.slice(endIdx);
    }
  }

  if (estimateV5Tokens(compressed) <= maxTokens) return compressed;

  // 尝试移除已引入技能部分
  const skillsMarker = '【已引入的技能】';
  if (compressed.includes(skillsMarker)) {
    const idx = compressed.indexOf(skillsMarker);
    const endIdx = compressed.indexOf('\n\n══════════════════════════════════════\n\n', idx);
    if (endIdx > idx) {
      compressed = compressed.slice(0, idx) + compressed.slice(endIdx);
    }
  }

  if (estimateV5Tokens(compressed) <= maxTokens) return compressed;

  // 尝试简化个案概念化（截断维持循环细节）
  const cfMarker = '【个案概念化';
  if (compressed.includes(cfMarker)) {
    const idx = compressed.indexOf(cfMarker);
    const endIdx = compressed.indexOf('\n\n══════════════════════════════════════\n\n', idx);
    if (endIdx > idx) {
      // 保留主诉和核心信念，截断其他
      const cfSection = compressed.slice(idx, endIdx);
      const lines = cfSection.split('\n');
      const keptLines = lines.filter(
        (line) =>
          line.includes('主诉') ||
          line.includes('核心信念') ||
          line.includes('治疗目标') ||
          line.includes('当前重点') ||
          line.includes('概念化置信度') ||
          line.includes('【个案概念化'),
      );
      compressed =
        compressed.slice(0, idx) +
        keptLines.join('\n') +
        '\n\n（概念化细节因长度限制已压缩）' +
        compressed.slice(endIdx);
    }
  }

  return compressed;
}
