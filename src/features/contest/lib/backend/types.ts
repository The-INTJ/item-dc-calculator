/**
 * Backend abstraction layer types for Mixology.
 *
 * These interfaces define the contract for data providers, allowing
 * seamless switching between in-memory, Firebase, or other backends
 * without changing frontend code.
 */

import type { Contest, Entry, Voter, ScoreEntry, ScoreBreakdown, ContestConfigItem } from '../../contexts/contest/contestTypes';

// Re-export core types for convenience
export type { Contest, Entry, Voter, ScoreEntry, ScoreBreakdown, ContestConfigItem };

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
  create(contest: Omit<Contest, 'id' | 'entries' | 'voters'>): Promise<ProviderResult<Contest>>;
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

/**
 * Voters provider interface - manage voters within contests
 */
export interface VotersProvider {
  listByContest(contestId: string): Promise<ProviderResult<Voter[]>>;
  getById(contestId: string, odId: string): Promise<ProviderResult<Voter | null>>;
  create(contestId: string, voter: Omit<Voter, 'id'> & { id?: string }): Promise<ProviderResult<Voter>>;
  update(contestId: string, voterId: string, updates: Partial<Voter>): Promise<ProviderResult<Voter>>;
  delete(contestId: string, voterId: string): Promise<ProviderResult<void>>;
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
  listByUser(contestId: string, userId: string): Promise<ProviderResult<ScoreEntry[]>>;
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
}

/**
 * Configs provider interface - manage contest configurations
 */
export interface ConfigsProvider {
  list(): Promise<ProviderResult<ContestConfigItem[]>>;
  getById(configId: string): Promise<ProviderResult<ContestConfigItem | null>>;
  create(config: Omit<ContestConfigItem, 'id'> & { id?: string }): Promise<ProviderResult<ContestConfigItem>>;
  update(configId: string, updates: Partial<ContestConfigItem>): Promise<ProviderResult<ContestConfigItem>>;
  delete(configId: string): Promise<ProviderResult<void>>;
}

/**
 * Combined backend provider - aggregates all sub-providers
 */
export interface BackendProvider {
  readonly name: string;
  contests: ContestsProvider;
  entries: EntriesProvider;
  voters: VotersProvider;
  scores: ScoresProvider;
  configs: ConfigsProvider;

  /**
   * Initialize the provider (connect to DB, load seed data, etc.)
   */
  initialize(): Promise<ProviderResult<void>>;

  /**
   * Clean up resources (close connections, etc.)
   */
  dispose(): Promise<void>;
}
