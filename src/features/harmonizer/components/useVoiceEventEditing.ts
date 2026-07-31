'use client';

import type { Dispatch } from 'react';
import type { VoiceEvent, VoiceId } from '../domain/music-types';
import type { WorkbenchState } from '../domain/workbench-state';
import type { WorkbenchAction } from '../state/actions';

/** Note-level edits on the working reading: locks, pitch steps, insert/delete, resize. */
export function useVoiceEventEditing(
  state: WorkbenchState,
  dispatch: Dispatch<WorkbenchAction>,
  dispatchStructural: (action: WorkbenchAction) => void,
) {
  const lockedEventIds = new Set(
    state.locks
      .filter(
        (lock) =>
          lock.targetType === 'voice_event' && lock.candidateId === state.selectedCandidateId,
      )
      .map((lock) => lock.targetId),
  );

  function toggleNoteLock(candidateId: string, event: VoiceEvent) {
    dispatchStructural({
      type: 'TOGGLE_LOCK',
      lock: {
        id: `lock-${event.id}`,
        targetType: 'voice_event',
        targetId: event.id,
        candidateId,
        valueSnapshot: event,
        createdAt: new Date().toISOString(),
      },
    });
  }

  function stepNote(candidateId: string, voice: VoiceId, eventId: string, direction: 1 | -1) {
    dispatchStructural({ type: 'STEP_VOICE_EVENT_PITCH', candidateId, voice, eventId, direction });
  }

  function insertNote(
    candidateId: string,
    voice: VoiceId,
    neighborEventId: string,
    side: 'before' | 'after',
    newEventId: string,
  ) {
    dispatchStructural({
      type: 'INSERT_VOICE_EVENT',
      candidateId,
      voice,
      neighborEventId,
      side,
      newEventId,
    });
  }

  function deleteNote(candidateId: string, voice: VoiceId, eventId: string) {
    dispatchStructural({ type: 'DELETE_VOICE_EVENT', candidateId, voice, eventId });
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

  return { lockedEventIds, toggleNoteLock, stepNote, insertNote, deleteNote, resizeNote };
}
