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

export interface WorkbenchState {
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  tempoBpm: number;
  acceptedContext: AcceptedContext;
  fragment: MelodyFragment;
  boundaryConstraints: BoundaryConstraint[];
  suggestionStatus: SuggestionStatus;
  candidateSetId: string | null;
  candidates: CandidatePath[];
  selectedCandidateId: string | null;
  locks: ConstraintLock[];
  playback: PlaybackState;
  history: WorkbenchSnapshot[];
  future: WorkbenchSnapshot[];
}

/** The undoable slice of workbench state (undo/redo lands in a later milestone). */
export type WorkbenchSnapshot = Pick<
  WorkbenchState,
  | 'tonalContext'
  | 'phraseIntent'
  | 'acceptedContext'
  | 'fragment'
  | 'boundaryConstraints'
  | 'candidates'
  | 'selectedCandidateId'
  | 'locks'
>;
