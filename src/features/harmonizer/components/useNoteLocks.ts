'use client';

import type { VoiceEvent } from '../domain/music-types';
import type { WorkbenchState } from '../domain/workbench-state';
import type { WorkbenchAction } from '../state/actions';

/**
 * Which notes of the working reading are held, and the toggle that holds them.
 *
 * A lock carries a snapshot of the note it was taken on, not just its id, so
 * what was locked is recorded rather than merely referenced.
 */
export function useNoteLocks(
  state: WorkbenchState,
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

  return { lockedEventIds, toggleNoteLock };
}
