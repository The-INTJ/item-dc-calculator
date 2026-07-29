/**
 * Workbench actions.
 *
 * WorkbenchActionType documents the full Phase 0 vocabulary (spec §14.2, plus
 * SET_TEMPO and PLAYBACK_PROGRESS, which the spec's list omits — tempo editing
 * and the playback cursor need them). WorkbenchAction carries only the actions
 * implemented so far (slice 1: milestones 1–3), so the reducer's exhaustive
 * switch has no dead branches and no silent no-ops. Each milestone extends the
 * union and the switch together; the AssertSubtype guard keeps the implemented
 * set inside the planned vocabulary at compile time.
 */

import type { HarmonizationFixture } from '../domain/fixture-types';
import type { VoiceId } from '../domain/music-types';

export type WorkbenchActionType =
  | 'LOAD_FIXTURE'
  | 'EDIT_TONAL_CONTEXT'
  | 'EDIT_PHRASE_INTENT'
  | 'ADD_MELODY_EVENT'
  | 'UPDATE_MELODY_EVENT'
  | 'DELETE_MELODY_EVENT'
  | 'SET_BOUNDARY_POLICY'
  | 'MARK_SUGGESTIONS_STALE'
  | 'REFRESH_SUGGESTIONS'
  | 'SELECT_CANDIDATE'
  | 'TOGGLE_LOCK'
  | 'CLEAR_LOCKS'
  | 'SET_TEMPO'
  | 'START_PLAYBACK'
  | 'STOP_PLAYBACK'
  | 'PLAYBACK_PROGRESS'
  | 'APPLY_CANDIDATE'
  | 'UNDO'
  | 'REDO';

export type WorkbenchAction =
  | { type: 'LOAD_FIXTURE'; fixture: HarmonizationFixture }
  | { type: 'SELECT_CANDIDATE'; candidateId: string }
  | { type: 'SET_TEMPO'; tempoBpm: number }
  | { type: 'START_PLAYBACK'; candidateId: string; voices: VoiceId[] }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'PLAYBACK_PROGRESS'; activeUnit: number | null };

type AssertSubtype<T extends U, U> = T;
export type ImplementedWorkbenchActionType = AssertSubtype<
  WorkbenchAction['type'],
  WorkbenchActionType
>;
