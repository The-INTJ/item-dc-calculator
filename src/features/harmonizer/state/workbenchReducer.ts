/**
 * Workbench reducer — full-POC edition. House pattern: pure reducer kept
 * module-private, exhaustive switch with no default case, hook wrapper
 * exported. The reducer imports only pure, deterministic modules (the static
 * fixture registry and the naive generator), so reducer purity holds.
 *
 * Live regeneration: every input edit (soprano notes, key, intent, accepted
 * harmony, locks) synchronously re-resolves suggestions via
 * domain/suggest.ts — there is no stale state and no manual refresh.
 *
 * History: MAX_HISTORY undoable snapshots; drags coalesce per gestureId; ids
 * are always minted by callers (no Date/crypto here — purity + StrictMode).
 */

import { useReducer } from 'react';
import type { HarmonizationFixture } from '../domain/fixture-types';
import type {
  MelodyEvent,
  SATBVoicing,
  VoiceEvent,
  VoiceId,
} from '../domain/music-types';
import { resolveLockEntries } from '../domain/lock-signature';
import { stepDiatonic } from '../domain/scale';
import { acceptedHarmonySignature } from '../domain/signatures';
import {
  asAcceptedHarmony,
  defaultCandidateSet,
  resolveSuggestions,
  type SuggestionResolution,
} from '../domain/suggest';
import { unitsToDuration, unitsToTime } from '../domain/timing';
import {
  deleteTimedEvent,
  insertAdjacentTimedEvent,
  resizeTimedEvents,
} from '../domain/voice-editing';
import type { WorkbenchSnapshot, WorkbenchState } from '../domain/workbench-state';
import { listFixtures } from '../fixtures/registry';
import type { WorkbenchAction } from './actions';

export const MIN_TEMPO_BPM = 40;
export const MAX_TEMPO_BPM = 200;
export const MAX_HISTORY = 50;

export function createInitialWorkbenchState(fixture: HarmonizationFixture): WorkbenchState {
  const candidateSet =
    fixture.candidateSets.find((set) => set.id === 'default') ?? fixture.candidateSets[0];
  const candidates = candidateSet ? candidateSet.candidates : [];
  return {
    tonalContext: fixture.initialState.tonalContext,
    phraseIntent: fixture.initialState.phraseIntent,
    tempoBpm: fixture.initialState.tempoBpm,
    acceptedContext: fixture.initialState.acceptedContext,
    appliedFragments: [],
    fragment: fixture.initialState.fragment,
    boundaryConstraints: fixture.initialState.boundaryConstraints,
    suggestionStatus: candidates.length > 0 ? 'fresh' : 'empty',
    suggestionSource: candidates.length > 0 ? 'authored' : null,
    suggestionNotice: null,
    sourceFixtureId: fixture.id,
    candidateSetId: candidateSet ? candidateSet.id : null,
    candidates,
    // Spec §10.1 step 7: the first candidate is preview-selected, not applied.
    selectedCandidateId: candidates.length > 0 ? candidates[0].id : null,
    locks: [],
    playback: { status: 'idle' },
    history: [],
    future: [],
    lastGestureId: null,
  };
}

/* ---------- history ---------- */

function takeSnapshot(state: WorkbenchState): WorkbenchSnapshot {
  return {
    tonalContext: state.tonalContext,
    phraseIntent: state.phraseIntent,
    acceptedContext: state.acceptedContext,
    appliedFragments: state.appliedFragments,
    fragment: state.fragment,
    boundaryConstraints: state.boundaryConstraints,
    suggestionStatus: state.suggestionStatus,
    suggestionSource: state.suggestionSource,
    suggestionNotice: state.suggestionNotice,
    sourceFixtureId: state.sourceFixtureId,
    candidateSetId: state.candidateSetId,
    candidates: state.candidates,
    selectedCandidateId: state.selectedCandidateId,
    locks: state.locks,
  };
}

/** Snapshot the PRE-mutation state; clears the redo stack. */
function pushHistory(state: WorkbenchState): WorkbenchState {
  return {
    ...state,
    history: [...state.history, takeSnapshot(state)].slice(-MAX_HISTORY),
    future: [],
    lastGestureId: null,
  };
}

/** Like pushHistory, but consecutive dispatches of one drag coalesce. */
function pushHistoryForGesture(state: WorkbenchState, gestureId: string): WorkbenchState {
  if (state.lastGestureId === gestureId) {
    return { ...state, future: [] };
  }
  return { ...pushHistory(state), lastGestureId: gestureId };
}

/* ---------- suggestion regeneration ---------- */

function applyResolution(
  state: WorkbenchState,
  resolution: SuggestionResolution,
): WorkbenchState {
  if (resolution.kind === 'keep_with_notice') {
    return { ...state, suggestionNotice: resolution.notice };
  }
  if (resolution.kind === 'empty') {
    return {
      ...state,
      candidates: [],
      candidateSetId: null,
      selectedCandidateId: null,
      suggestionStatus: 'empty',
      suggestionSource: null,
      suggestionNotice: null,
    };
  }
  const selectedCandidateId = resolution.candidates.some(
    (candidate) => candidate.id === state.selectedCandidateId,
  )
    ? state.selectedCandidateId
    : (resolution.candidates[0]?.id ?? null);
  return {
    ...state,
    candidates: resolution.candidates,
    candidateSetId: resolution.candidateSetId,
    sourceFixtureId: resolution.sourceFixtureId,
    selectedCandidateId,
    suggestionStatus: 'fresh',
    suggestionSource: resolution.suggestionSource,
    suggestionNotice: null,
    boundaryConstraints: resolution.boundaryConstraints ?? state.boundaryConstraints,
    locks: resolution.locks ?? state.locks,
  };
}

function regenerate(state: WorkbenchState): WorkbenchState {
  return applyResolution(
    state,
    resolveSuggestions({
      fragment: state.fragment,
      tonalContext: state.tonalContext,
      phraseIntent: state.phraseIntent,
      acceptedContext: state.acceptedContext,
      locks: state.locks,
      candidates: state.candidates,
      sourceFixtureId: state.sourceFixtureId,
      fixtures: listFixtures(),
    }),
  );
}

/* ---------- voice-edit helpers ---------- */

function withVoice(voicing: SATBVoicing, voice: VoiceId, events: VoiceEvent[]): SATBVoicing {
  return {
    soprano: voice === 'soprano' ? events : voicing.soprano,
    alto: voice === 'alto' ? events : voicing.alto,
    tenor: voice === 'tenor' ? events : voicing.tenor,
    bass: voice === 'bass' ? events : voicing.bass,
  };
}

function isNoteLocked(state: WorkbenchState, candidateId: string, eventId: string): boolean {
  return state.locks.some(
    (lock) =>
      lock.targetType === 'voice_event' &&
      lock.candidateId === candidateId &&
      lock.targetId === eventId,
  );
}

interface VoiceEditResult {
  candidates: WorkbenchState['candidates'];
  fragment: WorkbenchState['fragment'];
}

/**
 * Apply an edit to one voice of one candidate; soprano edits mirror onto the
 * melody fragment (index correspondence). Null = no-op.
 */
function editVoice(
  state: WorkbenchState,
  candidateId: string,
  voice: VoiceId,
  editEvents: (events: VoiceEvent[]) => VoiceEvent[] | null,
  editMelody: (events: MelodyEvent[]) => MelodyEvent[] | null,
): VoiceEditResult | null {
  const index = state.candidates.findIndex((candidate) => candidate.id === candidateId);
  if (index === -1) return null;
  const candidate = state.candidates[index];
  const edited = editEvents(candidate.voicing[voice]);
  if (!edited) return null;
  const voicing = withVoice(candidate.voicing, voice, edited);
  const candidates = state.candidates.map((entry, i) =>
    i === index ? { ...entry, voicing } : entry,
  );
  let fragment = state.fragment;
  if (voice === 'soprano') {
    const melodyEvents = editMelody(state.fragment.events);
    if (melodyEvents) fragment = { ...state.fragment, events: melodyEvents };
  }
  return { candidates, fragment };
}

/* ---------- reducer ---------- */

function workbenchReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'LOAD_FIXTURE':
      return createInitialWorkbenchState(action.fixture);

    case 'LOAD_SAMPLE': {
      const base = pushHistory(state);
      if (action.source.kind === 'fixture') {
        const fixture = action.source.fixture;
        const init = fixture.initialState;
        const acceptedContext = action.keepAcceptedContext
          ? state.acceptedContext
          : init.acceptedContext;
        const next: WorkbenchState = {
          ...base,
          tonalContext: init.tonalContext,
          phraseIntent: init.phraseIntent,
          tempoBpm: init.tempoBpm,
          acceptedContext,
          fragment: init.fragment,
          boundaryConstraints: init.boundaryConstraints,
          locks: [],
          sourceFixtureId: fixture.id,
        };
        const pinned = fixture.match.acceptedHarmonySignature;
        if (
          action.keepAcceptedContext &&
          pinned !== undefined &&
          pinned !== acceptedHarmonySignature(acceptedContext.previousHarmony)
        ) {
          // The kept context diverges from the fixture's pin — resolve honestly.
          return regenerate(next);
        }
        const set = defaultCandidateSet(fixture);
        return {
          ...next,
          candidates: set.candidates,
          candidateSetId: set.id,
          selectedCandidateId: set.candidates[0]?.id ?? null,
          suggestionStatus: set.candidates.length > 0 ? 'fresh' : 'empty',
          suggestionSource: set.candidates.length > 0 ? 'authored' : null,
          suggestionNotice: null,
        };
      }
      const next: WorkbenchState = {
        ...base,
        fragment: action.source.fragment,
        boundaryConstraints: [],
        locks: [],
        acceptedContext: action.keepAcceptedContext
          ? state.acceptedContext
          : { previousHarmony: null, previousVoicing: null },
        sourceFixtureId: null,
      };
      return regenerate(next);
    }

    case 'LOAD_PROJECT':
      return {
        ...state,
        ...action.workbench,
        playback: { status: 'idle' },
        history: [],
        future: [],
        lastGestureId: null,
      };

    case 'EDIT_TONAL_CONTEXT': {
      const same =
        state.tonalContext.tonicPitchClass === action.tonalContext.tonicPitchClass &&
        state.tonalContext.mode === action.tonalContext.mode &&
        state.tonalContext.minorDoSystem === action.tonalContext.minorDoSystem;
      if (same) return state;
      return regenerate({ ...pushHistory(state), tonalContext: action.tonalContext });
    }

    case 'EDIT_PHRASE_INTENT': {
      if (state.phraseIntent === action.phraseIntent) return state;
      return regenerate({ ...pushHistory(state), phraseIntent: action.phraseIntent });
    }

    case 'SET_ACCEPTED_HARMONY': {
      if (
        acceptedHarmonySignature(action.harmony) ===
        acceptedHarmonySignature(state.acceptedContext.previousHarmony)
      ) {
        return state;
      }
      return regenerate({
        ...pushHistory(state),
        acceptedContext: { previousHarmony: action.harmony, previousVoicing: null },
      });
    }

    case 'STEP_VOICE_EVENT_PITCH': {
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
      const next = { ...pushHistory(state), ...result };
      return action.voice === 'soprano' ? regenerate(next) : next;
    }

    case 'INSERT_VOICE_EVENT': {
      const insertEvents = (events: VoiceEvent[]): VoiceEvent[] | null => {
        const neighbor = events.find((event) => event.id === action.neighborEventId);
        if (!neighbor) return null;
        return insertAdjacentTimedEvent(events, action.neighborEventId, action.side, (placement) => ({
          id: action.newEventId,
          voice: action.voice,
          pitch: neighbor.pitch,
          scaleDegree: neighbor.scaleDegree,
          start: unitsToTime(placement.startUnits),
          duration: unitsToDuration(placement.units),
          tieFromPrevious: false,
        }));
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
          return insertAdjacentTimedEvent(events, neighbor.id, action.side, (placement) => ({
            id: `mel-${action.newEventId}`,
            pitch: neighbor.pitch,
            scaleDegree: neighbor.scaleDegree,
            start: unitsToTime(placement.startUnits),
            duration: unitsToDuration(placement.units),
            tieFromPrevious: false,
          }));
        },
      );
      if (!result) return state;
      const next = { ...pushHistory(state), ...result };
      return action.voice === 'soprano' ? regenerate(next) : next;
    }

    case 'DELETE_VOICE_EVENT': {
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
      const next = { ...pushHistory(state), ...result, locks };
      return action.voice === 'soprano' ? regenerate(next) : next;
    }

    case 'RESIZE_VOICE_EVENT': {
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
          }),
        (events) => {
          if (sopranoIndex === undefined || sopranoIndex < 0) return null;
          const melodyEvent = events[sopranoIndex];
          if (!melodyEvent) return null;
          return resizeTimedEvents(events, melodyEvent.id, action.edge, action.targetBoundary, {
            ripple: action.ripple,
          });
        },
      );
      if (!result) return state;
      const next = { ...pushHistoryForGesture(state, action.gestureId), ...result };
      return action.voice === 'soprano' ? regenerate(next) : next;
    }

    case 'SELECT_CANDIDATE': {
      if (state.selectedCandidateId === action.candidateId) return state;
      if (!state.candidates.some((candidate) => candidate.id === action.candidateId)) {
        return state;
      }
      return { ...pushHistory(state), selectedCandidateId: action.candidateId };
    }

    case 'TOGGLE_LOCK': {
      // Unlock removes every lock resolving to the same note VALUE (a lock-set
      // remap spreads one conceptual lock across sibling candidates).
      const clicked = resolveLockEntries([action.lock], state.candidates)[0] ?? null;
      const matching = state.locks.filter((lock) => {
        if (
          lock.targetType === action.lock.targetType &&
          lock.targetId === action.lock.targetId &&
          lock.candidateId === action.lock.candidateId
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
          : [...state.locks, action.lock];
      return regenerate({ ...pushHistory(state), locks });
    }

    case 'SET_TEMPO': {
      const tempoBpm = Math.min(
        MAX_TEMPO_BPM,
        Math.max(MIN_TEMPO_BPM, Math.round(action.tempoBpm)),
      );
      if (tempoBpm === state.tempoBpm) return state;
      return { ...state, tempoBpm };
    }

    case 'APPLY_CANDIDATE': {
      const candidate = state.candidates.find(
        (entry) => entry.id === state.selectedCandidateId,
      );
      if (!candidate) return state;
      const finalHarmony = candidate.harmonyEvents[candidate.harmonyEvents.length - 1];
      if (!finalHarmony) return state;
      return {
        ...pushHistory(state),
        appliedFragments: [
          ...state.appliedFragments,
          { id: action.appliedId, fragment: state.fragment, candidate },
        ],
        acceptedContext: {
          previousHarmony: asAcceptedHarmony(finalHarmony, action.appliedId),
          previousVoicing: null,
        },
      };
    }

    case 'UNDO': {
      const previous = state.history[state.history.length - 1];
      if (!previous) return state;
      return {
        ...state,
        ...previous,
        history: state.history.slice(0, -1),
        future: [...state.future, takeSnapshot(state)].slice(-MAX_HISTORY),
        lastGestureId: null,
        playback: { status: 'idle' },
      };
    }

    case 'REDO': {
      const next = state.future[state.future.length - 1];
      if (!next) return state;
      return {
        ...state,
        ...next,
        future: state.future.slice(0, -1),
        history: [...state.history, takeSnapshot(state)].slice(-MAX_HISTORY),
        lastGestureId: null,
        playback: { status: 'idle' },
      };
    }

    case 'START_PLAYBACK':
      return {
        ...state,
        playback: {
          status: 'playing',
          candidateId: action.candidateId,
          voices: action.voices,
          activeUnit: null,
        },
      };
    case 'STOP_PLAYBACK': {
      if (state.playback.status === 'idle') return state;
      return { ...state, playback: { status: 'idle' } };
    }
    case 'PLAYBACK_PROGRESS': {
      // Late cursor callbacks after a stop are dropped.
      if (state.playback.status !== 'playing') return state;
      if (state.playback.activeUnit === action.activeUnit) return state;
      return { ...state, playback: { ...state.playback, activeUnit: action.activeUnit } };
    }
  }
}

export function useWorkbenchReducer(initialFixture: HarmonizationFixture) {
  return useReducer(workbenchReducer, initialFixture, createInitialWorkbenchState);
}

/** Direct access for unit tests (spec §28.1); not exported from the barrel. */
export { workbenchReducer };
