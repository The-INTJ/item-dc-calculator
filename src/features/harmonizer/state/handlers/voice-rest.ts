/**
 * Silencing a note, and letting it speak again.
 *
 * A rest here is not the ABSENCE of a note — it is a note that is present and
 * not sounding. It keeps its pitch, its length and its place, so the change is
 * reversible and obeys THE SURFACE RULE: silencing one note never moves
 * another. Deleting is the separate, lossy operation; this one is a switch.
 *
 * Soprano silences mirror onto the melody fragment (index correspondence), or
 * the next regeneration would rebuild the soprano from a melody that never
 * heard about the rest and quietly un-silence it.
 */

import type { WorkbenchState } from '../../domain/workbench-state';
import type { WorkbenchAction } from '../actions';
import { editVoice } from './candidate-voice-edit';
import { pushHistory } from './history';
import { isNoteLocked } from './locks';
import { deriveCandidate, regenerate } from './suggestion-regeneration';

/** Flip one event's silence, leaving everything else about it alone. */
function flipRest<T extends { id: string; isRest?: boolean }>(
  events: T[],
  eventId: string,
): T[] | null {
  const index = events.findIndex((event) => event.id === eventId);
  if (index === -1) return null;
  return events.map((event, i) => (i === index ? { ...event, isRest: !event.isRest } : event));
}

export function toggleVoiceEventRest(
  state: WorkbenchState,
  action: Extract<WorkbenchAction, { type: 'TOGGLE_VOICE_EVENT_REST' }>,
): WorkbenchState {
  if (isNoteLocked(state, action.candidateId, action.eventId)) return state;
  const sopranoIndex = state.candidates
    .find((candidate) => candidate.id === action.candidateId)
    ?.voicing.soprano.findIndex((event) => event.id === action.eventId);

  const result = editVoice(
    state,
    action.candidateId,
    action.voice,
    (events) => flipRest(events, action.eventId),
    (events) => {
      if (sopranoIndex === undefined || sopranoIndex < 0) return null;
      const melodyEvent = events[sopranoIndex];
      return melodyEvent ? flipRest(events, melodyEvent.id) : null;
    },
  );
  if (!result) return state;

  const next = deriveCandidate({ ...pushHistory(state), ...result }, action.candidateId);
  return action.voice === 'soprano' ? regenerate(next) : next;
}
