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
 * A contest entry (drink, chili, cosplay, performance, etc.)
 */
export interface Entry {
  id: string;
  name: string;
  slug: string;
  description: string;
  submittedBy: string;
  /** Aggregate: sum of per-user average scores */
  sumScore?: number;
  /** Aggregate: number of distinct voters */
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
 * A first-class matchup between entries within a round.
 * Today always 1v1 (entryIds.length === 2); array shape leaves room for XvX later.
 */
export interface Matchup {
  id: string;
  contestId: string;
  roundId: string;
  /** Index within the round (0-based, stable across lifecycle). */
  slotIndex: number;
  /** Entries competing in this matchup. */
  entryIds: string[];
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
  entries: Entry[];
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
    contestant: { name: string; entryName: string },
  ) => Promise<Entry | null>;
  updateContestant: (contestId: string, entryId: string, updates: Partial<Entry>) => Promise<Entry | null>;
  removeContestant: (contestId: string, entryId: string) => Promise<boolean>;
  /** Replace the cached matchups for a contest (used by the realtime subscription). */
  setMatchupsForContest: (contestId: string, matchups: Matchup[]) => void;
  updateMatchup: (
    contestId: string,
    matchupId: string,
    updates: Partial<Matchup>,
  ) => Promise<Matchup | null>;
  /** Seed (or reseed) a round's matchups. For round 0 pass pairs; for N>0 derives from winners. */
  seedRound: (
    contestId: string,
    roundId: string,
    pairs?: Array<[string, string]>,
  ) => Promise<Matchup[] | null>;
}
