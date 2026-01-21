/**
 * Contest module - main entry point
 *
 * This module provides a general-purpose contest judging platform
 * that can handle any type of competition through configurable attributes.
 */

// Core types
export type {
  ContestConfig,
  AttributeConfig,
  ContestPhase,
  JudgeRole,
  Judge,
  ScoreBreakdown,
  Entry,
  ScoreEntry,
  Contest,
  ContestData,
  VoteCategory,
  // Legacy aliases
  Drink,
  MixologyData,
} from './types';

export { attributesToVoteCategories } from './types';

// Templates
export {
  MIXOLOGY_CONFIG,
  CHILI_CONFIG,
  COSPLAY_CONFIG,
  DANCE_CONFIG,
  BAKING_CONFIG,
  BBQ_CONFIG,
  DEFAULT_TEMPLATES,
  getTemplate,
  getTemplateList,
  getTemplateKeys,
  cloneConfig,
  getDefaultTemplate,
} from './templates';

// Validation
export {
  validateContestConfig,
  validateScoreBreakdown,
  createEmptyBreakdown,
  getAttributeMin,
  getAttributeMax,
  getAttributeWeight,
  isValidAttributeId,
  getAttributeIds,
  normalizeBreakdown,
  calculateWeightedTotal,
  type ValidationResult,
} from './validation';

// Backend
export {
  getBackendProvider,
  getBackendProviderSync,
  resetBackendProvider,
  type ContestBackendProvider,
  type MixologyBackendProvider,
  type ProviderResult,
  type ContestsProvider,
  type EntriesProvider,
  type DrinksProvider,
  type JudgesProvider,
  type ScoresProvider,
} from './backend';

// Auth
export {
  ContestAuthProvider,
  MixologyAuthProvider,
  useAuth,
  type AuthState,
  type AuthActions,
  type AuthContextValue,
  type UserProfile,
  type UserVote,
  type LocalSession,
} from './auth';

// Firebase
export {
  createFirebaseBackendProvider,
  createFirebaseAuthProvider,
  registerGuestIdentity,
  initializeFirebase,
} from './firebase';
