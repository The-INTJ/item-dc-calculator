/**
 * Barrel export for scoring utilities.
 */

export { createEmptyBreakdown, addBreakdowns, diffBreakdowns } from './breakdownUtils';
export {
  SCORE_LOCK_TTL_MS,
  SCORE_LOCK_MAX_RETRIES,
  SCORE_LOCK_BASE_DELAY_MS,
  SCORE_LOCK_JITTER_MS,
  CONTESTS_COLLECTION,
  ScoreLockError,
  buildLockBackoff,
  releaseEntryScoreLock,
} from './scoreLock';
export { applyEntryScoreUpdate, updateEntryScoresWithLock } from './scoreTransaction';
export type { UpdateEntryScoresOptions } from './scoreTransaction';
