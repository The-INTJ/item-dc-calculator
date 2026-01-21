/**
 * Backend abstraction layer types for Mixology.
 *
 * These interfaces define the contract for data providers, allowing
 * seamless switching between in-memory, Firebase, or other backends
 * without changing frontend code.
 */

import type { Contest, Entry, Judge, ScoreEntry, ScoreBreakdown } from '../../types';

// Re-export core types for convenience
export type { Contest, Entry, Judge, ScoreEntry, ScoreBreakdown };
/** @deprecated Use Entry instead */
export type { Drink } from '../../types';

/**
 * Result wrapper for async operations
 */
export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Contests provider interface - read/write operations for contests
 */
export interface ContestsProvider {
  // Read operations
  list(): Promise<ProviderResult<Contest[]>>;
  getBySlug(slug: string): Promise<ProviderResult<Contest | null>>;
  getDefault(): Promise<ProviderResult<Contest | null>>;

  // Write operations
  create(contest: Omit<Contest, 'id' | 'entries' | 'judges' | 'scores'>): Promise<ProviderResult<Contest>>;
  update(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>>;
  delete(id: string): Promise<ProviderResult<void>>;
  setDefault(id: string): Promise<ProviderResult<Contest>>;
}

/**
 * Entries provider interface - manage entries within contests
 */
export interface EntriesProvider {
  listByContest(contestId: string): Promise<ProviderResult<Entry[]>>;
  getById(contestId: string, entryId: string): Promise<ProviderResult<Entry | null>>;
  create(contestId: string, entry: Omit<Entry, 'id'>): Promise<ProviderResult<Entry>>;
  update(contestId: string, entryId: string, updates: Partial<Entry>): Promise<ProviderResult<Entry>>;
  delete(contestId: string, entryId: string): Promise<ProviderResult<void>>;
}

/** @deprecated Use EntriesProvider instead */
export type DrinksProvider = EntriesProvider;

/**
 * Judges provider interface - manage judges within contests
 */
export interface JudgesProvider {
  listByContest(contestId: string): Promise<ProviderResult<Judge[]>>;
  getById(contestId: string, judgeId: string): Promise<ProviderResult<Judge | null>>;
  create(contestId: string, judge: Omit<Judge, 'id'> & { id?: string }): Promise<ProviderResult<Judge>>;
  update(contestId: string, judgeId: string, updates: Partial<Judge>): Promise<ProviderResult<Judge>>;
  delete(contestId: string, judgeId: string): Promise<ProviderResult<void>>;
}

/**
 * Update payload for score entries - breakdown values plus optional notes.
 */
export interface ScoreUpdatePayload {
  breakdown?: Partial<ScoreBreakdown>;
  notes?: string;
}

/**
 * Scores provider interface - manage scores/ratings
 */
export interface ScoresProvider {
  listByEntry(contestId: string, entryId: string): Promise<ProviderResult<ScoreEntry[]>>;
  listByJudge(contestId: string, judgeId: string): Promise<ProviderResult<ScoreEntry[]>>;
  getById(contestId: string, scoreId: string): Promise<ProviderResult<ScoreEntry | null>>;
  submit(
    contestId: string,
    score: Omit<ScoreEntry, 'id'>
  ): Promise<ProviderResult<ScoreEntry>>;
  update(
    contestId: string,
    scoreId: string,
    updates: ScoreUpdatePayload
  ): Promise<ProviderResult<ScoreEntry>>;
  delete(contestId: string, scoreId: string): Promise<ProviderResult<void>>;
  /** @deprecated Use listByEntry instead */
  listByDrink?(contestId: string, drinkId: string): Promise<ProviderResult<ScoreEntry[]>>;
}

/**
 * Combined backend provider - aggregates all sub-providers
 */
export interface MixologyBackendProvider {
  readonly name: string;
  contests: ContestsProvider;
  entries: EntriesProvider;
  judges: JudgesProvider;
  scores: ScoresProvider;
  /** @deprecated Use entries instead */
  drinks?: EntriesProvider;

  /**
   * Initialize the provider (connect to DB, load seed data, etc.)
   */
  initialize(): Promise<ProviderResult<void>>;

  /**
   * Clean up resources (close connections, etc.)
   */
  dispose(): Promise<void>;
}
