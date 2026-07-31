/**
 * Constraint locks: the note-lock predicate voice edits consult, and the
 * TOGGLE_LOCK handler.
 */

import { resolveLockEntries } from '../../domain/lock-signature';
import type { ConstraintLock } from '../../domain/locks';
import type { WorkbenchState } from '../../domain/workbench-state';
import { pushHistory } from './history';
import { regenerate } from './suggestion-regeneration';

export function isNoteLocked(
  state: WorkbenchState,
  candidateId: string,
  eventId: string,
): boolean {
  return state.locks.some(
    (lock) =>
      lock.targetType === 'voice_event' &&
      lock.candidateId === candidateId &&
      lock.targetId === eventId,
  );
}

export function toggleLock(state: WorkbenchState, actionLock: ConstraintLock): WorkbenchState {
  // Unlock removes every lock resolving to the same note VALUE (a lock-set
  // remap spreads one conceptual lock across sibling candidates).
  const clicked = resolveLockEntries([actionLock], state.candidates)[0] ?? null;
  const matching = state.locks.filter((lock) => {
    if (
      lock.targetType === actionLock.targetType &&
      lock.targetId === actionLock.targetId &&
      lock.candidateId === actionLock.candidateId
    ) {
      return true;
    }
    if (!clicked) return false;
    const entry = resolveLockEntries([lock], state.candidates)[0];
    return (
      entry !== undefined &&
      entry.voice === clicked.voice &&
      entry.startUnit === clicked.startUnit &&
      entry.units === clicked.units &&
      entry.pitch.midi === clicked.pitch.midi
    );
  });
  const locks =
    matching.length > 0
      ? state.locks.filter((lock) => !matching.includes(lock))
      : [...state.locks, actionLock];
  return regenerate({ ...pushHistory(state), locks });
}
