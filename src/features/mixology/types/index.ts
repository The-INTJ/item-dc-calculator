// Core domain types
export type {
  ContestPhase,
  JudgeRole,
  Judge,
  Drink,
  ScoreBreakdown,
  MixologyScoreBreakdown,
  VoteCategory,
  ScoreEntry,
  ContestRound,
  Contest,
  MixologyData,
  // ContestConfig types
  AttributeConfig,
  ContestConfig,
} from './types';

// Config templates
export {
  MIXOLOGY_CONFIG,
  CHILI_CONFIG,
  COSPLAY_CONFIG,
  DANCE_CONFIG,
  DEFAULT_TEMPLATES,
  getTemplate,
  getTemplateKeys,
  getDefaultConfig,
} from './templates';

// Validation helpers
export {
  getAttributeIds,
  isValidAttributeId,
  createEmptyBreakdown,
  validateBreakdown,
  getEffectiveConfig,
} from './validation';

// UI-specific types
export * from './uiTypes';
