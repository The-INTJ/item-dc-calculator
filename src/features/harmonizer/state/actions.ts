/**
 * Workbench actions.
 *
 * WorkbenchActionType documents the full-POC vocabulary. Relative to spec
 * §14.2: ADD/UPDATE/DELETE_MELODY_EVENT are superseded by voice-event editing
 * with soprano→melody mirroring; SET_BOUNDARY_POLICY died with the boundary
 * UI; MARK_SUGGESTIONS_STALE and REFRESH_SUGGESTIONS died with live
 * regeneration (every edit re-resolves synchronously); SET_TEMPO,
 * PLAYBACK_PROGRESS, STEP/INSERT/RESIZE_VOICE_EVENT, LOAD_SAMPLE and
 * LOAD_PROJECT are additions the spec's list omits. The AssertSubtype guard
 * keeps the implemented union inside the vocabulary at compile time.
 */

import type { HarmonizationFixture } from '../domain/fixture-types';
import type { ConstraintLock } from '../domain/locks';
import type { HarmonyEvent, MelodyFragment, PhraseIntent, TonalContext, VoiceId } from '../domain/music-types';
import type { PersistedWorkbench } from '../domain/workbench-state';

export type WorkbenchActionType =
  | 'LOAD_FIXTURE'
  | 'LOAD_SAMPLE'
  | 'LOAD_PROJECT'
  | 'EDIT_TONAL_CONTEXT'
  | 'EDIT_PHRASE_INTENT'
  | 'SET_ACCEPTED_HARMONY'
  | 'STEP_VOICE_EVENT_PITCH'
  | 'INSERT_VOICE_EVENT'
  | 'DELETE_VOICE_EVENT'
  | 'RESIZE_VOICE_EVENT'
  | 'SELECT_CANDIDATE'
  | 'TOGGLE_LOCK'
  | 'SET_TEMPO'
  | 'START_PLAYBACK'
  | 'STOP_PLAYBACK'
  | 'PLAYBACK_PROGRESS'
  | 'APPLY_CANDIDATE'
  | 'UNDO'
  | 'REDO';

export type WorkbenchAction =
  | { type: 'LOAD_FIXTURE'; fixture: HarmonizationFixture }
  | {
      type: 'LOAD_SAMPLE';
      source:
        | { kind: 'fixture'; fixture: HarmonizationFixture }
        | { kind: 'blank'; fragment: MelodyFragment };
      keepAcceptedContext: boolean;
    }
  | { type: 'LOAD_PROJECT'; workbench: PersistedWorkbench }
  | { type: 'EDIT_TONAL_CONTEXT'; tonalContext: TonalContext }
  | { type: 'EDIT_PHRASE_INTENT'; phraseIntent: PhraseIntent }
  | { type: 'SET_ACCEPTED_HARMONY'; harmony: HarmonyEvent | null }
  | {
      type: 'STEP_VOICE_EVENT_PITCH';
      candidateId: string;
      voice: VoiceId;
      eventId: string;
      direction: 1 | -1;
    }
  | {
      type: 'INSERT_VOICE_EVENT';
      candidateId: string;
      voice: VoiceId;
      neighborEventId: string;
      side: 'before' | 'after';
      newEventId: string;
    }
  | { type: 'DELETE_VOICE_EVENT'; candidateId: string; voice: VoiceId; eventId: string }
  | { type: 'SELECT_CANDIDATE'; candidateId: string }
  | { type: 'SET_TEMPO'; tempoBpm: number }
  | {
      type: 'RESIZE_VOICE_EVENT';
      candidateId: string;
      voice: VoiceId;
      eventId: string;
      edge: 'left' | 'right';
      /** 0-based sixteenth boundary the dragged edge should land on. */
      targetBoundary: number;
      /** Shift-drag: translate later notes, changing the part's length. */
      ripple: boolean;
      /** Minted per pointerdown; consecutive dispatches coalesce to one undo entry. */
      gestureId: string;
    }
  | { type: 'TOGGLE_LOCK'; lock: ConstraintLock }
  | { type: 'START_PLAYBACK'; candidateId: string; voices: VoiceId[] }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'PLAYBACK_PROGRESS'; activeUnit: number | null }
  | { type: 'APPLY_CANDIDATE'; appliedId: string }
  | { type: 'UNDO' }
  | { type: 'REDO' };

type AssertSubtype<T extends U, U> = T;
export type ImplementedWorkbenchActionType = AssertSubtype<
  WorkbenchAction['type'],
  WorkbenchActionType
>;
