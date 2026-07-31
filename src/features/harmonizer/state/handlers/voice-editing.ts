/**
 * Voice-event editing: pitch stepping, insert, delete, resize — every edit
 * obeys THE SURFACE RULE (an edit to one note NEVER moves another note and
 * NEVER swaps the working reading); soprano edits mirror onto the melody
 * fragment (index correspondence).
 */

import type { VoiceEvent } from '../../domain/music-types';
import { stepDiatonic } from '../../domain/scale';
import { unitsToDuration, unitsToTime } from '../../domain/timing';
import {
  deleteTimedEvent,
  insertAdjacentTimedEvent,
  resizeTimedEvents,
} from '../../domain/voice-editing';
import type { WorkbenchState } from '../../domain/workbench-state';
import type { WorkbenchAction } from '../actions';
import { editVoice, measureCap } from './candidate-voice-edit';
import { pushHistory, pushHistoryForGesture } from './history';
import { isNoteLocked } from './locks';
import { deriveCandidate, regenerate } from './suggestion-regeneration';

/* ---------- action handlers ---------- */

export function stepVoiceEventPitch(
  state: WorkbenchState,
  action: Extract<WorkbenchAction, { type: 'STEP_VOICE_EVENT_PITCH' }>,
): WorkbenchState {
  if (isNoteLocked(state, action.candidateId, action.eventId)) return state;
  const stepEvents = (events: VoiceEvent[]): VoiceEvent[] | null => {
    const index = events.findIndex((event) => event.id === action.eventId);
    if (index === -1) return null;
    const stepped = stepDiatonic(state.tonalContext, events[index], action.direction);
    if (!stepped) return null;
    return events.map((event, i) =>
      i === index ? { ...event, pitch: stepped.pitch, scaleDegree: stepped.scaleDegree } : event,
    );
  };
  const sopranoIndex = state.candidates
    .find((candidate) => candidate.id === action.candidateId)
    ?.voicing.soprano.findIndex((event) => event.id === action.eventId);
  const result = editVoice(state, action.candidateId, action.voice, stepEvents, (events) => {
    if (sopranoIndex === undefined || sopranoIndex < 0) return null;
    const melodyEvent = events[sopranoIndex];
    if (!melodyEvent) return null;
    const stepped = stepDiatonic(state.tonalContext, melodyEvent, action.direction);
    if (!stepped) return null;
    return events.map((event, i) =>
      i === sopranoIndex
        ? { ...event, pitch: stepped.pitch, scaleDegree: stepped.scaleDegree }
        : event,
    );
  });
  if (!result) return state;
  const next = deriveCandidate({ ...pushHistory(state), ...result }, action.candidateId);
  return action.voice === 'soprano' ? regenerate(next) : next;
}

export function insertVoiceEvent(
  state: WorkbenchState,
  action: Extract<WorkbenchAction, { type: 'INSERT_VOICE_EVENT' }>,
): WorkbenchState {
  const insertEvents = (events: VoiceEvent[]): VoiceEvent[] | null => {
    const neighbor = events.find((event) => event.id === action.neighborEventId);
    if (!neighbor) return null;
    return insertAdjacentTimedEvent(
      events,
      action.neighborEventId,
      action.side,
      (placement) => ({
        id: action.newEventId,
        voice: action.voice,
        pitch: neighbor.pitch,
        scaleDegree: neighbor.scaleDegree,
        start: unitsToTime(placement.startUnits),
        duration: unitsToDuration(placement.units),
        tieFromPrevious: false,
      }),
      { maxTotalUnits: measureCap(events) },
    );
  };
  const sopranoNeighborIndex = state.candidates
    .find((candidate) => candidate.id === action.candidateId)
    ?.voicing.soprano.findIndex((event) => event.id === action.neighborEventId);
  const result = editVoice(
    state,
    action.candidateId,
    action.voice,
    insertEvents,
    (events) => {
      if (sopranoNeighborIndex === undefined || sopranoNeighborIndex < 0) return null;
      const neighbor = events[sopranoNeighborIndex];
      if (!neighbor) return null;
      return insertAdjacentTimedEvent(
        events,
        neighbor.id,
        action.side,
        (placement) => ({
          id: `mel-${action.newEventId}`,
          pitch: neighbor.pitch,
          scaleDegree: neighbor.scaleDegree,
          start: unitsToTime(placement.startUnits),
          duration: unitsToDuration(placement.units),
          tieFromPrevious: false,
        }),
        { maxTotalUnits: measureCap(events) },
      );
    },
  );
  if (!result) return state;
  const next = deriveCandidate({ ...pushHistory(state), ...result }, action.candidateId);
  return action.voice === 'soprano' ? regenerate(next) : next;
}

export function deleteVoiceEvent(
  state: WorkbenchState,
  action: Extract<WorkbenchAction, { type: 'DELETE_VOICE_EVENT' }>,
): WorkbenchState {
  if (isNoteLocked(state, action.candidateId, action.eventId)) return state;
  const sopranoIndex = state.candidates
    .find((candidate) => candidate.id === action.candidateId)
    ?.voicing.soprano.findIndex((event) => event.id === action.eventId);
  const result = editVoice(
    state,
    action.candidateId,
    action.voice,
    (events) => deleteTimedEvent(events, action.eventId),
    (events) => {
      if (sopranoIndex === undefined || sopranoIndex < 0) return null;
      const melodyEvent = events[sopranoIndex];
      if (!melodyEvent) return null;
      return deleteTimedEvent(events, melodyEvent.id);
    },
  );
  if (!result) return state;
  const locks = state.locks.filter(
    (lock) => !(lock.targetType === 'voice_event' && lock.targetId === action.eventId),
  );
  const next = deriveCandidate(
    { ...pushHistory(state), ...result, locks },
    action.candidateId,
  );
  return action.voice === 'soprano' ? regenerate(next) : next;
}

export function resizeVoiceEvent(
  state: WorkbenchState,
  action: Extract<WorkbenchAction, { type: 'RESIZE_VOICE_EVENT' }>,
): WorkbenchState {
  if (isNoteLocked(state, action.candidateId, action.eventId)) return state;
  const sopranoIndex = state.candidates
    .find((candidate) => candidate.id === action.candidateId)
    ?.voicing.soprano.findIndex((event) => event.id === action.eventId);
  const result = editVoice(
    state,
    action.candidateId,
    action.voice,
    (events) =>
      resizeTimedEvents(events, action.eventId, action.edge, action.targetBoundary, {
        ripple: action.ripple,
        maxTotalUnits: measureCap(events),
      }),
    (events) => {
      if (sopranoIndex === undefined || sopranoIndex < 0) return null;
      const melodyEvent = events[sopranoIndex];
      if (!melodyEvent) return null;
      return resizeTimedEvents(events, melodyEvent.id, action.edge, action.targetBoundary, {
        ripple: action.ripple,
        maxTotalUnits: measureCap(events),
      });
    },
  );
  if (!result) return state;
  const next = deriveCandidate(
    { ...pushHistoryForGesture(state, action.gestureId), ...result },
    action.candidateId,
  );
  return action.voice === 'soprano' ? regenerate(next) : next;
}
