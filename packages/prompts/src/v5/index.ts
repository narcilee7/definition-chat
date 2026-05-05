/**
 * OhMe V5 Prompt System
 *
 * V5 整合取向治疗师 Prompt 系统。
 * 与 V2 五层 Prompt 系统并存，V5 提供更统一、更深度的治疗对话体验。
 */

// Core therapist prompt and builders
export {
  V5_THERAPIST_CORE,
  buildV5PhaseAwareness,
  buildV5CaseFormulation,
  buildV5PersonaStyle,
  buildV5PreviousInsights,
  buildV5SkillsIntroduced,
} from './therapist';

// Compiler
export {
  compileV5SystemPrompt,
  estimateV5Tokens,
  compressV5IfNeeded,
} from './compiler';
export type { V5CompileOptions } from './compiler';
