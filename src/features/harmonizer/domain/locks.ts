/**
 * Constraint locks — spec §16. Locks are constraints on regeneration, stored
 * separately from candidate fixture data. Interactive locking arrives in a
 * later milestone; the state model carries them from the start.
 */

export type LockTargetType =
  | 'harmony_event'
  | 'chord_identity'
  | 'inversion'
  | 'voice_event'
  | 'voice_row'
  | 'bass_line'
  | 'complete_voicing';

export interface ConstraintLock {
  id: string;
  targetType: LockTargetType;
  targetId: string;
  candidateId: string;
  valueSnapshot: unknown;
  createdAt: string;
}
