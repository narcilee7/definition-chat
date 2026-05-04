// OhMe Prompts — Centralized prompt management
export { buildGuidePrompt, firstEncounterPrompt } from './guide.js';
export type { GuideContext } from './guide.js';

export {
  sessionNotesPrompt,
  MEMORY_EXTRACTION_SYSTEM,
  memoryExtractionPrompt,
  PROFILE_UPDATE_SYSTEM,
  profileUpdatePrompt,
} from './insight.js';
export type { ProfileUpdateInput } from './insight.js';
