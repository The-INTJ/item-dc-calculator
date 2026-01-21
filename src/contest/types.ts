/**
 * Core types for the Contest system.
 *
 * This module defines the data structures for a general-purpose contest
 * judging platform that supports any type of competition (mixology, chili,
 * cosplay, dance, etc.) through configurable contest attributes.
 */

// ============================================================================
// Contest Configuration Types
// ============================================================================

/**
 * Configuration for a single scoring attribute.
 * Defines what judges will score entries on.
 */
export interface AttributeConfig {
  /** Unique identifier (lowercase alphanumeric with underscores) */
  id: string;
  /** Display name shown to judges */
  label: string;
  /** Optional helper text explaining what to evaluate */
  description?: string;
  /** Weight for scoring calculations (default: 1) */
  weight?: number;
  /** Minimum score value (default: 0) */
  min?: number;
  /** Maximum score value (default: 10) */
  max?: number;
}

/**
 * Configuration that defines the shape of a contest.
 * Can be deserialized from JSON for easy customization.
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

// ============================================================================
// Core Entity Types
// ============================================================================

export type ContestPhase = 'setup' | 'active' | 'judging' | 'closed';
export type JudgeRole = 'admin' | 'judge' | 'viewer';

/**
 * A judge or participant in a contest.
 */
export interface Judge {
  id: string;
  displayName: string;
  role: JudgeRole;
  contact?: string;
}

/**
 * Dynamic score breakdown - keys are attribute IDs from the contest config.
 * Replaces the old fixed ScoreBreakdown interface.
 */
export type ScoreBreakdown = Record<string, number>;

/**
 * An entry in a contest (formerly "Drink" in the mixology-specific version).
 * Generic term that works for any contest type.
 */
export interface Entry {
  id: string;
  name: string;
  slug: string;
  description: string;
  round: string;
  submittedBy: string;
  /** Scores organized by user ID */
  scoreByUser?: Record<string, ScoreBreakdown>;
  /** Aggregated score totals across all judges */
  scoreTotals?: ScoreBreakdown;
  /** Lock state to prevent concurrent score updates */
  scoreLock?: {
    locked: boolean;
    expiresAt?: number;
    token?: string;
    updatedAt?: number;
  };
}

/**
 * A score submission from a judge for an entry.
 */
export interface ScoreEntry {
  id: string;
  entryId: string;
  judgeId: string;
  /** Dynamic breakdown based on contest config attributes */
  breakdown: ScoreBreakdown;
  notes?: string;
}

/**
 * A contest event with configuration, entries, judges, and scores.
 */
export interface Contest {
  id: string;
  name: string;
  slug: string;
  phase: ContestPhase;
  /** Configuration defining the contest type and scoring attributes */
  config: ContestConfig;
  location?: string;
  startTime?: string;
  bracketRound?: string;
  currentEntryId?: string;
  defaultContest?: boolean;
  entries: Entry[];
  judges: Judge[];
  scores: ScoreEntry[];
}

/**
 * Root data structure for the contest system.
 */
export interface ContestData {
  contests: Contest[];
}

// ============================================================================
// Legacy Type Aliases (for gradual migration)
// ============================================================================

/** @deprecated Use Entry instead */
export type Drink = Entry;

/** @deprecated Use ContestData instead */
export type MixologyData = ContestData;

// ============================================================================
// Vote Category (UI display type, derived from config)
// ============================================================================

/**
 * UI-friendly representation of a voting category.
 * Derived from AttributeConfig for display purposes.
 */
export interface VoteCategory {
  id: string;
  label: string;
  description?: string;
  sortOrder: number;
}

/**
 * Convert contest config attributes to vote categories for UI rendering.
 */
export function attributesToVoteCategories(config: ContestConfig): VoteCategory[] {
  return config.attributes.map((attr, index) => ({
    id: attr.id,
    label: attr.label,
    description: attr.description,
    sortOrder: index,
  }));
}
