/**
 * Workbench application state — spec §14.1, with the gap-fill types the spec
 * references but never defines (AcceptedContext, PlaybackState,
 * WorkbenchSnapshot). One deliberate rename: `boundaryConstraints`
 * (BoundaryConstraint[], spec §15.6) instead of §14.1's bare
 * `boundaryPolicies: HarmonicBoundaryPolicy[]`, which loses which boundary
 * each policy belongs to.
 */

import type { CandidatePath } from './analysis-types';
import type { ConstraintLock } from './locks';
import type {
  BoundaryConstraint,
  HarmonyEvent,
  MelodyFragment,
  PhraseIntent,
  SATBVoicing,
  TonalContext,
  VoiceId,
} from './music-types';

export interface AcceptedContext {
  /**
   * The previous harmony as a full HarmonyEvent at a notional preceding
   * measure (measure 0), so the rail chip and the future Apply flow share one
   * shape. Null = the fragment opens the piece.
   */
  previousHarmony: HarmonyEvent | null;
  previousVoicing: SATBVoicing | null;
}

export type PlaybackState =
  | { status: 'idle' }
  | {
      status: 'playing';
      candidateId: string;
      /** The voices sounding in this session, in SATB order (melody-only = ['soprano']). */
      voices: VoiceId[];
      /** 1-based timeline unit under the playback cursor; null between passes. */
      activeUnit: number | null;
    };

export type SuggestionStatus = 'fresh' | 'stale' | 'loading' | 'empty' | 'error';

/** Where the current candidates came from — the derivability probe's headline. */
export type SuggestionSource = 'authored' | 'computed';

/**
 * One measure of the hymn — a pill on the Current-hymn rail. The SELECTED
 * measure's entry mirrors the workspace live (the reducer's write-through
 * sync), so the rail never shows a stale snapshot of what's being edited.
 */
export interface AppliedFragment {
  id: string;
  fragment: MelodyFragment;
  candidate: CandidatePath;
}

export interface WorkbenchState {
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  tempoBpm: number;
  acceptedContext: AcceptedContext;
  appliedFragments: AppliedFragment[];
  fragment: MelodyFragment;
  boundaryConstraints: BoundaryConstraint[];
  /** With live regeneration only 'fresh' and 'empty' occur. */
  suggestionStatus: SuggestionStatus;
  suggestionSource: SuggestionSource | null;
  /** Fixture the current/last authored candidates came from (drives lock-set lookup + Restore). */
  sourceFixtureId: string | null;
  candidateSetId: string | null;
  candidates: CandidatePath[];
  selectedCandidateId: string | null;
  locks: ConstraintLock[];
  playback: PlaybackState;
  history: WorkbenchSnapshot[];
  future: WorkbenchSnapshot[];
  /** Drag-coalescing bookkeeping; transient — excluded from snapshots and persistence. */
  lastGestureId: string | null;
  /**
   * The always-on cursor into the hymn: which appliedFragments entry the
   * workspace is editing. Core state — undoable (in snapshots) and persisted.
   * Soft invariant: non-null whenever a working candidate exists; the only
   * null corners are empty-candidate states (blank sample in an unsupported
   * mode, an old save with no working reading).
   */
  selectedMeasureId: string | null;
}

/** The undoable slice of workbench state. */
export type WorkbenchSnapshot = Pick<
  WorkbenchState,
  | 'tonalContext'
  | 'phraseIntent'
  | 'acceptedContext'
  | 'appliedFragments'
  | 'fragment'
  | 'boundaryConstraints'
  | 'suggestionStatus'
  | 'suggestionSource'
  | 'sourceFixtureId'
  | 'candidateSetId'
  | 'candidates'
  | 'selectedCandidateId'
  | 'locks'
  | 'selectedMeasureId'
>;

/**
 * A candidate as a saved project stores it — the Tier-1 strip: everything
 * re-derivable from the notes (harmonyEvents, melodyInterpretations,
 * derivability, approach) is DROPPED and rebuilt on load, so engine evolution
 * never touches the persistence schema again. Curated-feeling fields (title,
 * summary, descriptors, evidence, provenance) survive verbatim.
 */
export type PersistedCandidate = Omit<
  CandidatePath,
  'harmonyEvents' | 'melodyInterpretations' | 'derivability' | 'approach'
>;

export interface PersistedAppliedFragment {
  id: string;
  fragment: MelodyFragment;
  candidate: PersistedCandidate;
}

/**
 * What a saved project stores (projects layer imports domain only) — v2:
 * suggestion cards are never persisted (they regenerate on load); only the
 * WORKING reading is kept, stripped. Locks persist only when they point at
 * the working reading's notes.
 */
export interface PersistedWorkbench {
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  tempoBpm: number;
  acceptedContext: AcceptedContext;
  appliedFragments: PersistedAppliedFragment[];
  fragment: MelodyFragment;
  boundaryConstraints: BoundaryConstraint[];
  sourceFixtureId: string | null;
  workingCandidate: PersistedCandidate | null;
  locks: ConstraintLock[];
  /**
   * Additive (2026-07-30): which appliedFragments entry the workspace was
   * editing. Optional so pre-measures saves still parse under strictObject —
   * when absent, LOAD_PROJECT appends fragment/workingCandidate as the
   * selected measure (the one-time migration to the unified measure list).
   * `fragment` and `workingCandidate` stay persisted even though write-through
   * makes them copies of the selected entry: they are required keys in old
   * saves and the migration source.
   */
  selectedMeasureId?: string;
}
