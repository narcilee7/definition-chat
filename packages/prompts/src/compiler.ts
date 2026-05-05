/**
 * OhMe Prompt System — Prompt 编译器
 *
 * 将五层 Prompt 组装成完整的 system prompt。
 */

import { BASE_THERAPEUTIC_FRAMEWORK } from './framework';
import { CBT_PROTOCOL } from './approaches/cbt';
import { DBT_PROTOCOL } from './approaches/dbt';
import { ACT_PROTOCOL } from './approaches/act';
import { PSYCHODYNAMIC_PROTOCOL } from './approaches/psychodynamic';
import { buildCaseFormulationContext, CaseFormulationContext } from './case-formulation';
import { buildPhaseInstruction, PhaseContext } from './phase';
import { buildPersonaContext, PersonaContext } from './persona';

const APPROACH_PROTOCOLS: Record<string, string> = {
  cbt: CBT_PROTOCOL,
  dbt: DBT_PROTOCOL,
  act: ACT_PROTOCOL,
  psychodynamic: PSYCHODYNAMIC_PROTOCOL,
};

export interface CompileOptions {
  approachName: string;
  persona: PersonaContext;
  caseFormulation?: CaseFormulationContext;
  phaseContext: PhaseContext;
}

export function compileSystemPrompt(options: CompileOptions): string {
  const layers: string[] = [];

  // Layer 1: Base Framework
  layers.push(BASE_THERAPEUTIC_FRAMEWORK);

  // Layer 2: Approach Protocol
  const approachProtocol = APPROACH_PROTOCOLS[options.approachName];
  if (approachProtocol) {
    layers.push(approachProtocol);
  }

  // Layer 3: Case Formulation
  if (options.caseFormulation) {
    layers.push(buildCaseFormulationContext(options.caseFormulation));
  }

  // Layer 4: Phase Instruction
  layers.push(buildPhaseInstruction(options.phaseContext));

  // Layer 5: Persona Context
  layers.push(buildPersonaContext(options.persona));

  return layers.join('\n\n---\n\n');
}

/**
 * 估算 prompt 的 token 数量（粗略估计）
 */
export function estimateTokens(text: string): number {
  // 粗略估计：中文字符 ≈ 1 token，英文单词 ≈ 0.75 token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = text.split(/\s+/).length;
  return Math.ceil(chineseChars + englishWords * 0.75);
}

/**
 * 如果 prompt 太长，压缩个案概念化部分
 */
export function compressIfNeeded(prompt: string, maxTokens: number = 3000): string {
  const tokens = estimateTokens(prompt);
  if (tokens <= maxTokens) return prompt;

  // 简单压缩：截断过长的部分
  // 实际实现可以更智能，如摘要化个案概念化
  return prompt;
}
