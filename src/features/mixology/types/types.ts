/**
 * Contest lifecycle states as defined in the Master Plan:
 * - debug: Admin-only testing mode (not used during live events)
 * - set: Guests arriving and choosing roles
 * - shake: Entries being judged, timer running, voting OPEN
 * - scored: Voting CLOSED, tallying scores
 */
export type ContestPhase = 'debug' | 'set' | 'shake' | 'scored';
export type JudgeRole = 'admin' | 'judge' | 'viewer';

// ============================================================================
// Contest Configuration (for extensible contest types)
// ============================================================================

/**
 * Configuration for a single scoring attribute.
 */
export interface AttributeConfig {
  /** Unique identifier (lowercase alphanumeric with underscores) */
  id: string;
  /** Display name shown to judges */
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
}

export interface Judge {
  id: string;
  displayName: string;
  role: JudgeRole;
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
  round: string;
  submittedBy: string;
  scoreByUser?: Record<string, ScoreBreakdown>;
  scoreTotals?: ScoreBreakdown;
  scoreLock?: {
    locked: boolean;
    expiresAt?: number;
    token?: string;
    updatedAt?: number;
  };
}

/**
 * @deprecated Use Entry instead. Kept for backward compatibility.
 */
export type Drink = Entry;

/**
 * Dynamic score breakdown - keys are attribute IDs from the contest config.
 * For Mixology: { aroma, balance, presentation, creativity, overall }
 * For Chili: { heat, flavor, texture, appearance, overall }
 * etc.
 */
export type ScoreBreakdown = Record<string, number | null>;

/**
 * Legacy fixed breakdown for backward compatibility.
 * Use ScoreBreakdown (dynamic) for new code.
 */
export interface MixologyScoreBreakdown {
  aroma: number;
  balance: number;
  presentation: number;
  creativity: number;
  overall: number;
}

export interface VoteCategory {
  id: string;
  label: string;
  description?: string;
  sortOrder: number;
}

export interface ScoreEntry {
  id: string;
  entryId: string;
  judgeId: string;
  breakdown: ScoreBreakdown;
  notes?: string;
  naSections?: string[];
  /** @deprecated Use entryId instead */
  drinkId?: string;
}

export interface ContestRound {
  id: string;
  name: string;
  number?: number | null;
  /** Each round has its own state; the active round's state is the global state */
  state: ContestPhase;
}

export interface Contest {
  id: string;
  name: string;
  slug: string;
  phase: ContestPhase;
  /** Configuration defining contest type and scoring attributes */
  config?: ContestConfig;
  location?: string;
  startTime?: string;
  bracketRound?: string;
  currentEntryId?: string;
  defaultContest?: boolean;
  rounds?: ContestRound[];
  activeRoundId?: string | null;
  futureRoundId?: string | null;
  /** @deprecated Use config.attributes instead */
  categories?: VoteCategory[];
  entries: Entry[];
  judges: Judge[];
  scores: ScoreEntry[];
  /** @deprecated Use currentEntryId instead */
  currentDrinkId?: string;
}

export interface MixologyData {
  contests: Contest[];
}
