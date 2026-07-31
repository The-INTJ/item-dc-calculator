/**
 * Workbench actions.
 *
 * WorkbenchActionType documents the full-POC vocabulary. Relative to spec
 * §14.2: ADD/UPDATE/DELETE_MELODY_EVENT are superseded by voice-event editing
 * with soprano→melody mirroring; SET_BOUNDARY_POLICY died with the boundary
 * UI; MARK_SUGGESTIONS_STALE and REFRESH_SUGGESTIONS died with live
 * regeneration (every edit re-resolves synchronously); APPLY_CANDIDATE died
 * with the unified measure list (the workspace writes through into the
 * selected measure, so there is nothing left to "apply"); SET_TEMPO,
 * PLAYBACK_PROGRESS, STEP/INSERT/RESIZE_VOICE_EVENT, LOAD_SAMPLE,
 * LOAD_PROJECT, ADD_MEASURE and SELECT_MEASURE are additions/renames the
 * spec's list omits. The AssertSubtype guard keeps the implemented union
 * inside the vocabulary at compile time.
 */

import type { HarmonizationFixture } from '../domain/fixture-types';
import type { ConstraintLock } from '../domain/locks';
import type { MelodyFragment, PhraseIntent, TonalContext, VoiceId } from '../domain/music-types';
import type { PersistedWorkbench } from '../domain/workbench-state';

export type WorkbenchActionType =
  | 'LOAD_FIXTURE'
  | 'LOAD_SAMPLE'
  | 'LOAD_PROJECT'
  | 'EDIT_TONAL_CONTEXT'
  | 'EDIT_PHRASE_INTENT'
  | 'STEP_VOICE_EVENT_PITCH'
  | 'TOGGLE_VOICE_EVENT_REST'
  | 'INSERT_VOICE_EVENT'
  | 'DELETE_VOICE_EVENT'
  | 'RESIZE_VOICE_EVENT'
  | 'SELECT_CANDIDATE'
  | 'TOGGLE_LOCK'
  | 'SET_TEMPO'
  | 'START_PLAYBACK'
  | 'STOP_PLAYBACK'
  | 'PLAYBACK_PROGRESS'
  | 'ADD_MEASURE'
  | 'SELECT_MEASURE'
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
  | {
      type: 'STEP_VOICE_EVENT_PITCH';
      candidateId: string;
      voice: VoiceId;
      eventId: string;
      direction: 1 | -1;
      /**
       * How far a step goes. The lanes' arrows move to the next scale degree
       * (the default); the staff's note grid moves by half steps, so it can
       * reach the notes between them.
       */
      motion?: 'diatonic' | 'chromatic';
      /**
       * Shared by every dispatch belonging to ONE human action, so undo takes
       * them back together. A grid click that moves three half steps is three
       * dispatches but one thing the user did.
       */
      gestureId?: string;
    }
  | {
      /** Silence a note, or let a silenced one speak again. It keeps its pitch. */
      type: 'TOGGLE_VOICE_EVENT_REST';
      candidateId: string;
      voice: VoiceId;
      eventId: string;
    }
  | {
      type: 'INSERT_VOICE_EVENT';
      /**
       * Take whatever room is left when the neighbour's length will not fit,
       * rather than refusing. The staff's add buttons fill out a measure this
       * way; the lanes' ghost inserts still want the plain all-or-nothing.
       */
      shrinkToFit?: boolean;
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
  /**
   * Append a fresh measure at the END of the hymn (continuing from the tail's
   * final chord — domain/next-fragment.ts) and select it. Never replaces:
   * the outgoing measure is already up to date via write-through. One
   * undoable step — "Add measure" on the rail. `appliedId` names the NEW
   * measure.
   */
  | {
      type: 'ADD_MEASURE';
      appliedId: string;
      fragmentId: string;
      candidateId: string;
      melodyEventId: string;
      voiceEventIds: Record<VoiceId, string>;
    }
  /**
   * Load a measure into the workspace for editing. No commit step — the
   * measure being left already mirrors the workspace (write-through).
   */
  | { type: 'SELECT_MEASURE'; appliedId: string }
  | { type: 'UNDO' }
  | { type: 'REDO' };

type AssertSubtype<T extends U, U> = T;
export type ImplementedWorkbenchActionType = AssertSubtype<
  WorkbenchAction['type'],
  WorkbenchActionType
>;
