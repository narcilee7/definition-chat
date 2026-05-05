// Layer 1: Base Framework
export { BASE_THERAPEUTIC_FRAMEWORK } from './framework';

// Layer 2: Approach Protocols
export { CBT_PROTOCOL, CBT_APPROACH_NAME, CBT_DISPLAY_NAME } from './approaches/cbt';
export { DBT_PROTOCOL, DBT_APPROACH_NAME, DBT_DISPLAY_NAME } from './approaches/dbt';
export { ACT_PROTOCOL, ACT_APPROACH_NAME, ACT_DISPLAY_NAME } from './approaches/act';
export { PSYCHODYNAMIC_PROTOCOL, PSYCHODYNAMIC_APPROACH_NAME, PSYCHODYNAMIC_DISPLAY_NAME } from './approaches/psychodynamic';

// Layer 3: Case Formulation
export { buildCaseFormulationContext } from './case-formulation';
export type { CaseFormulationContext } from './case-formulation';

// Layer 4: Phase
export { buildPhaseInstruction } from './phase';
export type { SessionPhase, PhaseContext } from './phase';

// Layer 5: Persona
export { buildPersonaContext } from './persona';
export type { PersonaContext } from './persona';

// Compiler
export { compileSystemPrompt, estimateTokens, compressIfNeeded } from './compiler';
export type { CompileOptions } from './compiler';

// Risk
export { RISK_DETECTION_SYSTEM_PROMPT, CRISIS_INTERVENTION_PROMPT, SAFETY_PLAN_PROMPT } from './risk';
export type { RiskDetectionResult } from './risk';

// Assessment
export {
  PHQ9_QUESTIONS,
  interpretPHQ9,
  GAD7_QUESTIONS,
  interpretGAD7,
  ASSESSMENT_SCORING_PROMPT,
  SESSION_OUTCOME_PROMPT,
} from './assessment';

// V5: Integrative Therapist Prompt System
export {
  V5_THERAPIST_CORE,
  buildV5PhaseAwareness,
  buildV5CaseFormulation,
  buildV5PersonaStyle,
  buildV5PreviousInsights,
  buildV5SkillsIntroduced,
  compileV5SystemPrompt,
  estimateV5Tokens,
  compressV5IfNeeded,
} from './v5';
export type { V5CompileOptions } from './v5';
