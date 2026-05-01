/**
 * Core contest domain types.
 */

/**
 * Matchup lifecycle phase.
 * - set: Slot assigned, not yet open for scoring
 * - shake: Scoring is OPEN (voting live)
 * - scored: Scoring CLOSED (winner determined)
 */
export type MatchupPhase = 'set' | 'shake' | 'scored';

export type UserRole = 'admin' | 'voter' | 'competitor';

/**
 * Computed round status, derived from constituent matchup phases and admin override.
 */
export type RoundStatus = 'pending' | 'upcoming' | 'active' | 'closed';

// ============================================================================
// Contest Configuration (for extensible contest types)
// ============================================================================

/**
 * Configuration for a single scoring attribute.
 */
export interface AttributeConfig {
  /** Unique identifier (lowercase alphanumeric with underscores) */
  id: string;
  /** Display name shown to users */
  label: string;
  /** Optional helper text explaining what to evaluate */
  description?: string;
  /** Minimum score value (default: 0) */
  min?: number;
  /** Maximum score value (default: 10) */
  max?: number;
}

/**
 * Configuration that defines the shape of a contest.
 * Allows different contest types (mixology, chili, cosplay, etc.)
 */
export interface ContestConfig {
  /** The type of contest (e.g., "Mixology", "Chili", "Cosplay") */
  topic: string;
  /** Scoring dimensions for this contest type */
  attributes: AttributeConfig[];
  /** Singular label for entries (default: "Entry") */
  entryLabel?: string;
  /** Plural label for entries (default: "Entries") */
  entryLabelPlural?: string;
  /** Singular label for contestants (default: "Contestant", e.g. "Mixologist") */
  contestantLabel?: string;
  /** Plural label for contestants (default: "Contestants", e.g. "Mixologists") */
  contestantLabelPlural?: string;
}

/**
 * Stored contest configuration with unique ID.
 * Used for the /api/contest/configs endpoints.
 */
export interface ContestConfigItem extends ContestConfig {
  /** Unique identifier for this configuration */
  id: string;
}

export interface Voter {
  id: string;
  displayName: string;
  role: UserRole;
  contact?: string;
}

/**
 * A contestant participating in a contest. One Contestant per person.
 * Each round, the contestant submits a fresh Entry per matchup they're in.
 */
export interface Contestant {
  id: string;
  displayName: string;
  /** Firebase UID — set when a registered user IS this contestant. Used for self-vote checks. */
  userId?: string;
  contact?: string;
}

/**
 * A contest entry — a single creation (drink, dish, etc.) submitted by a
 * contestant for one specific matchup. A contestant has one Entry per
 * matchup they appear in. Stored inline on the parent Matchup document.
 */
export interface Entry {
  id: string;
  contestantId: string;
  matchupId: string;
  /** Per-game name (e.g. drink name); empty until contestant submits. */
  name: string;
  description?: string;
  slug?: string;
  /** Aggregate: sum of per-user average scores for this matchup entry */
  sumScore?: number;
  /** Aggregate: number of distinct voters for this matchup entry */
  voteCount?: number;
}

/**
 * Dynamic score breakdown - keys are attribute IDs from the contest config.
 * For Mixology: { aroma, balance, presentation, creativity, overall }
 * For Chili: { heat, flavor, texture, appearance, overall }
 * etc.
 */
export type ScoreBreakdown = Record<string, number>;

export interface ScoreEntry {
  id: string;
  entryId: string;
  userId: string;
  /** Matchup this vote belongs to. */
  matchupId: string;
  breakdown: ScoreBreakdown;
  notes?: string;
}

/**
 * A first-class matchup between contestants within a round.
 * Today always 1v1 (entries.length === 2); array shape leaves room for XvX later.
 *
 * Each matchup carries its own per-contestant entries inline — `entries[i]`
 * is the entry submitted by `entries[i].contestantId` for THIS matchup.
 * Score aggregates live on each entry.
 */
export interface Matchup {
  id: string;
  contestId: string;
  roundId: string;
  /** Index within the round (0-based, stable across lifecycle). */
  slotIndex: number;
  /** Per-matchup entries (one per contestant slot). */
  entries: Entry[];
  /** Current lifecycle phase. */
  phase: MatchupPhase;
  /** Winner entry ID once phase becomes 'scored'. Null if tie or undecided. */
  winnerEntryId?: string | null;
  /** ID of the next-round matchup this feeds into. */
  advancesToMatchupId?: string | null;
  /** Slot index (0 or 1) of the downstream matchup that this winner fills. */
  advancesToSlot?: number | null;
}

export interface ContestRound {
  id: string;
  name: string;
  number?: number | null;
  /**
   * Admin escape hatch. When set, overrides the computed round status.
   * - 'active': force the round open even if all matchups are scored.
   * - 'closed': force the round closed even if matchups are still in progress.
   * - null/undefined: computed from matchup phases.
   */
  adminOverride?: 'active' | 'closed' | null;
}

export interface Contest {
  id: string;
  name: string;
  slug: string;
  /** Configuration defining contest type and scoring attributes */
  config?: ContestConfig;
  location?: string;
  startTime?: string;
  currentEntryId?: string;
  defaultContest?: boolean;
  rounds?: ContestRound[];
  contestants: Contestant[];
  voters: Voter[];
}

// ============================================================================
// Context State (internal to ContestContext)
// ============================================================================

export interface ContestContextState {
  contests: Contest[];
  /** Matchups keyed by contestId; populated by the matchup subscription. */
  matchupsByContestId: Record<string, Matchup[]>;
  loading: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
}

export type ContestContextStateUpdater = (prev: ContestContextState) => ContestContextState;

export interface ContestActions {
  updateContest: (contestId: string, updates: Partial<Contest>) => void;
  upsertContest: (contest: Contest) => void;
  addContest: (name: string) => Promise<Contest | null>;
  deleteContest: (contestId: string) => Promise<boolean>;
  addRound: (contestId: string) => Promise<boolean>;
  updateRound: (contestId: string, roundId: string, updates: Partial<ContestRound>) => Promise<boolean>;
  removeRound: (contestId: string, roundId: string) => Promise<boolean>;
  /** Admin override for a round's status. Pass null to clear. */
  setRoundOverride: (
    contestId: string,
    roundId: string,
    override: 'active' | 'closed' | null,
  ) => Promise<boolean>;
  addContestant: (
    contestId: string,
    contestant: { displayName: string; userId?: string; contact?: string },
  ) => Promise<Contestant | null>;
  updateContestant: (
    contestId: string,
    contestantId: string,
    updates: Partial<Contestant>,
  ) => Promise<Contestant | null>;
  removeContestant: (contestId: string, contestantId: string) => Promise<boolean>;
  /** Replace the cached matchups for a contest (used by the realtime subscription). */
  setMatchupsForContest: (contestId: string, matchups: Matchup[]) => void;
  updateMatchup: (
    contestId: string,
    matchupId: string,
    updates: Partial<Matchup>,
  ) => Promise<Matchup | null>;
  /** Set or update a contestant's per-matchup entry name. */
  setMatchupEntryName: (
    contestId: string,
    matchupId: string,
    entryId: string,
    payload: { name: string; description?: string },
  ) => Promise<Matchup | null>;
  /**
   * Seed (or reseed) a round's matchups. For round 0 pass pairs (contestant ids);
   * for N>0 derives from winners. Pairs may be `[a, b]` (regular matchup) or
   * `[a]` (bye / auto-advance).
   */
  seedRound: (
    contestId: string,
    roundId: string,
    pairs?: Array<[string, string] | [string]>,
  ) => Promise<{ matchups: Matchup[] | null; error: string | null }>;
  createMatchup: (
    contestId: string,
    matchup: {
      roundId: string;
      slotIndex: number;
      contestantIds: string[];
      phase?: MatchupPhase;
      winnerEntryId?: string | null;
    },
  ) => Promise<Matchup | null>;
  deleteMatchup: (contestId: string, matchupId: string) => Promise<boolean>;
}
