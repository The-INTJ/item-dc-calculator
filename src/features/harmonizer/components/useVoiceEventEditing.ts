'use client';

import type { Dispatch } from 'react';
import type { VoiceId } from '../domain/music-types';
import type { WorkbenchState } from '../domain/workbench-state';
import type { WorkbenchAction } from '../state/actions';
import { useNoteLocks } from './useNoteLocks';

/**
 * How a pitch step differs from the plain one the lanes' arrows take. Both are
 * optional so the lanes keep passing nothing at all.
 */
export interface StepNoteOptions {
  /** Half steps rather than scale steps — the staff grid's y-axis. */
  motion?: 'diatonic' | 'chromatic';
  /** Ties several dispatches into one undo entry. */
  gestureId?: string;
}

/** How the staff's add buttons differ from the lanes' ghost inserts. */
export interface InsertNoteOptions {
  /** Take the room that is left when the neighbour's length will not fit. */
  shrinkToFit?: boolean;
}

/** Note-level edits on the working reading: locks, pitch steps, insert/delete, resize. */
export function useVoiceEventEditing(
  state: WorkbenchState,
  dispatch: Dispatch<WorkbenchAction>,
  dispatchStructural: (action: WorkbenchAction) => void,
) {
  const locks = useNoteLocks(state, dispatchStructural);

  function stepNote(
    candidateId: string,
    voice: VoiceId,
    eventId: string,
    direction: 1 | -1,
    options: StepNoteOptions = {},
  ) {
    dispatchStructural({
      type: 'STEP_VOICE_EVENT_PITCH',
      candidateId,
      voice,
      eventId,
      direction,
      ...options,
    });
  }

  function insertNote(
    candidateId: string,
    voice: VoiceId,
    neighborEventId: string,
    side: 'before' | 'after',
    newEventId: string,
    options: InsertNoteOptions = {},
  ) {
    dispatchStructural({
      type: 'INSERT_VOICE_EVENT',
      candidateId,
      voice,
      neighborEventId,
      side,
      newEventId,
      ...options,
    });
  }

  function deleteNote(candidateId: string, voice: VoiceId, eventId: string) {
    dispatchStructural({ type: 'DELETE_VOICE_EVENT', candidateId, voice, eventId });
  }

  function toggleNoteRest(candidateId: string, voice: VoiceId, eventId: string) {
    dispatchStructural({ type: 'TOGGLE_VOICE_EVENT_REST', candidateId, voice, eventId });
  }

  function resizeNote(
    candidateId: string,
    voice: VoiceId,
    eventId: string,
    edge: 'left' | 'right',
    targetBoundary: number,
    ripple: boolean,
    gestureId: string,
  ) {
    dispatch({
      type: 'RESIZE_VOICE_EVENT',
      candidateId,
      voice,
      eventId,
      edge,
      targetBoundary,
      ripple,
      gestureId,
    });
  }

  return { ...locks, stepNote, insertNote, deleteNote, toggleNoteRest, resizeNote };
}
