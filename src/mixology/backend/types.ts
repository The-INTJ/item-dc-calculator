/**
 * Backend abstraction layer types for Mixology.
 *
 * These interfaces define the contract for data providers, allowing
 * seamless switching between in-memory, Firebase, or other backends
 * without changing frontend code.
 */

import type { Contest, Drink, Judge, ScoreEntry, ScoreBreakdown } from '../types';

// Re-export core types for convenience
export type { Contest, Drink, Judge, ScoreEntry, ScoreBreakdown };

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
  create(contest: Omit<Contest, 'id' | 'drinks' | 'judges' | 'scores'>): Promise<ProviderResult<Contest>>;
  update(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>>;
  delete(id: string): Promise<ProviderResult<void>>;
  setDefault(id: string): Promise<ProviderResult<Contest>>;
}

/**
 * Drinks provider interface - manage drinks within contests
 */
export interface DrinksProvider {
  listByContest(contestId: string): Promise<ProviderResult<Drink[]>>;
  getById(contestId: string, drinkId: string): Promise<ProviderResult<Drink | null>>;
  create(contestId: string, drink: Omit<Drink, 'id'>): Promise<ProviderResult<Drink>>;
  update(contestId: string, drinkId: string, updates: Partial<Drink>): Promise<ProviderResult<Drink>>;
  delete(contestId: string, drinkId: string): Promise<ProviderResult<void>>;
}

/**
 * Judges provider interface - manage judges within contests
 */
export interface JudgesProvider {
  listByContest(contestId: string): Promise<ProviderResult<Judge[]>>;
  getById(contestId: string, judgeId: string): Promise<ProviderResult<Judge | null>>;
  create(contestId: string, judge: Omit<Judge, 'id'>): Promise<ProviderResult<Judge>>;
  update(contestId: string, judgeId: string, updates: Partial<Judge>): Promise<ProviderResult<Judge>>;
  delete(contestId: string, judgeId: string): Promise<ProviderResult<void>>;
}

/**
 * Scores provider interface - manage scores/ratings
 */
export interface ScoresProvider {
  listByDrink(contestId: string, drinkId: string): Promise<ProviderResult<ScoreEntry[]>>;
  listByJudge(contestId: string, judgeId: string): Promise<ProviderResult<ScoreEntry[]>>;
  getById(contestId: string, scoreId: string): Promise<ProviderResult<ScoreEntry | null>>;
  submit(
    contestId: string,
    score: Omit<ScoreEntry, 'id'>
  ): Promise<ProviderResult<ScoreEntry>>;
  update(
    contestId: string,
    scoreId: string,
    updates: Partial<ScoreBreakdown & { notes?: string }>
  ): Promise<ProviderResult<ScoreEntry>>;
  delete(contestId: string, scoreId: string): Promise<ProviderResult<void>>;
}

/**
 * Combined backend provider - aggregates all sub-providers
 */
export interface MixologyBackendProvider {
  readonly name: string;
  contests: ContestsProvider;
  drinks: DrinksProvider;
  judges: JudgesProvider;
  scores: ScoresProvider;

  /**
   * Initialize the provider (connect to DB, load seed data, etc.)
   */
  initialize(): Promise<ProviderResult<void>>;

  /**
   * Clean up resources (close connections, etc.)
   */
  dispose(): Promise<void>;
}
