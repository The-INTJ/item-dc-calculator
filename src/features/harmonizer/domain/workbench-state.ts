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

/** One applied (committed) fragment — a chip on the accepted rail. */
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
>;

/** What a saved project stores (projects layer imports domain only). */
export type PersistedWorkbench = WorkbenchSnapshot & Pick<WorkbenchState, 'tempoBpm'>;
