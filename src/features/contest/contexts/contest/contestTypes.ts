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

/**
 * @deprecated Use {@link MatchupPhase}. Kept as alias so old imports compile during the matchup refactor.
 */
export type ContestPhase = MatchupPhase;

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
  /**
   * @deprecated Entries are now contest-scoped. Round assignment is via `Matchup.entryIds`.
   * Kept as optional during the matchup refactor; will be removed in PR 8.
   */
  round?: string;
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
  /** Matchup this vote belongs to. Required for new votes. */
  matchupId?: string;
  /**
   * @deprecated Use {@link matchupId}. Kept for legacy vote docs during the matchup refactor.
   */
  round?: string;
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
   * @deprecated Round status is now computed from its matchups' phases.
   * Kept as optional during the matchup refactor; will be removed in PR 8.
   */
  state?: MatchupPhase;
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
  /**
   * @deprecated No longer authoritative; derive from active round's matchup phases.
   * Optional during the matchup refactor; will be removed in PR 8.
   */
  phase?: MatchupPhase;
  /** Configuration defining contest type and scoring attributes */
  config?: ContestConfig;
  location?: string;
  startTime?: string;
  /** @deprecated Vestigial label field. Will be removed in PR 8. */
  bracketRound?: string;
  currentEntryId?: string;
  defaultContest?: boolean;
  rounds?: ContestRound[];
  /** @deprecated Derived from rounds' matchup phases. Will be removed in PR 8. */
  activeRoundId?: string | null;
  /** @deprecated Derived from rounds' matchup phases. Will be removed in PR 8. */
  futureRoundId?: string | null;
  entries: Entry[];
  voters: Voter[];
}

// ============================================================================
// Context State (internal to ContestContext)
// ============================================================================

export interface ContestContextState {
  contests: Contest[];
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
  setActiveRound: (contestId: string, roundId: string) => Promise<boolean>;
  setRoundState: (contestId: string, roundId: string, state: MatchupPhase) => Promise<boolean>;
  addContestant: (contestId: string, contestant: { name: string; entryName: string; roundId: string }) => Promise<Entry | null>;
  updateContestant: (contestId: string, entryId: string, updates: Partial<Entry>) => Promise<Entry | null>;
  removeContestant: (contestId: string, entryId: string) => Promise<boolean>;
}
