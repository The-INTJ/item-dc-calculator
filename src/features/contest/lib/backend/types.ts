/**
 * Backend abstraction layer types for Mixology.
 *
 * These interfaces define the contract for data providers, allowing
 * seamless switching between in-memory, Firebase, or other backends
 * without changing frontend code.
 */

import type { Contest, Contestant, Entry, Voter, ScoreEntry, ScoreBreakdown, ContestConfigItem, Matchup } from '../../contexts/contest/contestTypes';
import type { UserProfile } from '../../contexts/auth/types';

// Re-export core types for convenience
export type { Contest, Contestant, Entry, Voter, ScoreEntry, ScoreBreakdown, ContestConfigItem, Matchup, UserProfile };

/**
 * Result wrapper for async operations
 */
export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** Machine-readable error code (see lib/domain/errorCodes.ts) when the API supplied one. */
  errorCode?: string;
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
  create(contest: Omit<Contest, 'id' | 'contestants' | 'voters'>): Promise<ProviderResult<Contest>>;
  update(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>>;
  delete(id: string): Promise<ProviderResult<void>>;
  setDefault(id: string): Promise<ProviderResult<Contest>>;
}

/**
 * Contestants provider interface — manages the `contest.contestants` array
 * stored on each contest document. Contestants are the identity record for
 * a participant; their per-game Entry records live on each Matchup.
 */
export interface ContestantsProvider {
  listByContest(contestId: string): Promise<ProviderResult<Contestant[]>>;
  getById(contestId: string, contestantId: string): Promise<ProviderResult<Contestant | null>>;
  create(contestId: string, contestant: Omit<Contestant, 'id'> & { id?: string }): Promise<ProviderResult<Contestant>>;
  update(
    contestId: string,
    contestantId: string,
    updates: Partial<Contestant>,
  ): Promise<ProviderResult<Contestant>>;
  delete(contestId: string, contestantId: string): Promise<ProviderResult<void>>;
  /**
   * Remove a contestant AND their participation: entries stripped from every
   * matchup (2-entry matchups collapse to a scored bye; empty matchups are
   * deleted), winners recomputed, votes ON their entries purged. Votes they
   * cast on other entries and their Voter record are kept.
   * See domain/contestantRemoval.ts for the pure planning logic.
   */
  removeCascade(contestId: string, contestantId: string): Promise<ProviderResult<void>>;
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

/** One entry's scores within an atomic ballot. */
export interface BallotScoreInput {
  entryId: string;
  breakdown: ScoreBreakdown;
}

/**
 * A voter's complete ballot for one matchup — every entry's breakdown,
 * committed atomically (all land or none do).
 */
export interface BallotInput {
  matchupId: string;
  userId: string;
  scores: BallotScoreInput[];
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
  /**
   * Submit a whole matchup ballot in one transaction. The matchup phase is
   * re-checked inside the transaction, so a ballot racing a round close
   * either fully lands or is fully rejected — never a partial ballot.
   */
  submitBallot(contestId: string, input: BallotInput): Promise<ProviderResult<ScoreEntry[]>>;
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
 * Fields a user is allowed to set on their own profile.
 * `role` is intentionally excluded — admins set roles via separate admin flows.
 */
export type SelfProfileUpdates = Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>;

/**
 * Profiles provider interface - manage the `users/{uid}` documents.
 *
 * Writes always happen server-side (Admin SDK) so the client never mutates
 * its own role. Reads return null if no profile exists yet.
 */
export interface ProfilesProvider {
  get(uid: string): Promise<ProviderResult<UserProfile | null>>;
  upsert(uid: string, profile: UserProfile): Promise<ProviderResult<UserProfile>>;
  updateSelf(uid: string, updates: SelfProfileUpdates): Promise<ProviderResult<UserProfile>>;
}

/**
 * Input shape for matchup creation. Server generates `id` and injects
 * `contestId`, so callers only provide the fields that describe the matchup.
 * `entries` may be supplied pre-built (e.g. by the seed route), or omitted
 * and built from `contestantIds`.
 */
export type MatchupCreateInput = Omit<Matchup, 'id' | 'contestId' | 'entries'> & {
  id?: string;
  entries?: Entry[];
  contestantIds?: string[];
};

/**
 * Matchups provider interface — manages `contests/{contestId}/matchups/{matchupId}`
 * subcollection documents.
 *
 * Matchups are the first-class unit of scoring. Round status is computed
 * from the phases of its constituent matchups (see domain/matchupGetters.ts).
 */
export interface MatchupsProvider {
  listByContest(contestId: string): Promise<ProviderResult<Matchup[]>>;
  listByRound(contestId: string, roundId: string): Promise<ProviderResult<Matchup[]>>;
  getById(contestId: string, matchupId: string): Promise<ProviderResult<Matchup | null>>;
  create(contestId: string, matchup: MatchupCreateInput): Promise<ProviderResult<Matchup>>;
  update(contestId: string, matchupId: string, updates: Partial<Matchup>): Promise<ProviderResult<Matchup>>;
  delete(contestId: string, matchupId: string): Promise<ProviderResult<void>>;
  /** Create multiple matchups in one batch (used when seeding a round). */
  batchCreate(contestId: string, matchups: MatchupCreateInput[]): Promise<ProviderResult<Matchup[]>>;
  /** Update one inline entry's name/description on a matchup. */
  setEntryName(
    contestId: string,
    matchupId: string,
    entryId: string,
    payload: { name: string; description?: string },
  ): Promise<ProviderResult<Matchup>>;
}

/**
 * Combined backend provider - aggregates all sub-providers
 */
export interface BackendProvider {
  readonly name: string;
  contests: ContestsProvider;
  contestants: ContestantsProvider;
  voters: VotersProvider;
  scores: ScoresProvider;
  configs: ConfigsProvider;
  profiles: ProfilesProvider;
  matchups: MatchupsProvider;

  /**
   * Initialize the provider (connect to DB, load seed data, etc.)
   */
  initialize(): Promise<ProviderResult<void>>;

  /**
   * Clean up resources (close connections, etc.)
   */
  dispose(): Promise<void>;
}
