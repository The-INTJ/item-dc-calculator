/**
 * Workbench reducer — full-POC edition. House pattern: pure reducer kept
 * module-private, exhaustive switch with no default case, hook wrapper
 * exported. The reducer imports only pure, deterministic modules (the static
 * fixture registry and the naive generator), so reducer purity holds.
 *
 * THE SURFACE RULE (Drew): the selected reading's notes are the source of
 * truth. An edit to one note NEVER moves another note and NEVER swaps the
 * working reading — its chord analysis re-derives FROM the sounding notes
 * (domain/derive-harmony.ts). Live regeneration only replaces the SUGGESTION
 * cards around the surface; adopting one is an explicit card click.
 *
 * THE UNIFIED MEASURE LIST: the hymn (appliedFragments) always contains every
 * measure INCLUDING the one being edited; selectedMeasureId points at it.
 * The exported reducer wraps the core switch in syncSelectedMeasure, which
 * writes the workspace back into the selected entry after every action — the
 * rail pill is live and nothing ever needs an explicit commit.
 *
 * History: MAX_HISTORY undoable snapshots (selection included — undo across a
 * measure switch restores what you saw); drags coalesce per gestureId; ids
 * are always minted by callers (no Date/crypto here — purity + StrictMode).
 *
 * Case bodies live in concept-named modules under ./handlers/; this file is
 * the thin dispatcher plus the trivial cases.
 */

import { useReducer } from 'react';
import type { HarmonizationFixture } from '../domain/fixture-types';
import type { WorkbenchState } from '../domain/workbench-state';
import type { WorkbenchAction } from './actions';
import { pushHistory, redo, undo } from './handlers/history';
import { editTonalContext } from './handlers/key-change';
import { toggleLock } from './handlers/locks';
import { addMeasure, selectMeasure, syncSelectedMeasure } from './handlers/measure-list';
import {
  createInitialWorkbenchState,
  loadProject,
  loadSample,
} from './handlers/project-lifecycle';
import { regenerate } from './handlers/suggestion-regeneration';
import {
  deleteVoiceEvent,
  insertVoiceEvent,
  resizeVoiceEvent,
  stepVoiceEventPitch,
} from './handlers/voice-editing';
import { toggleVoiceEventRest } from './handlers/voice-rest';

export const MIN_TEMPO_BPM = 40;
export const MAX_TEMPO_BPM = 200;
export { MAX_HISTORY } from './handlers/history';
export { createInitialWorkbenchState };

/* ---------- reducer ---------- */

function coreReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'LOAD_FIXTURE':
      return createInitialWorkbenchState(action.fixture);

    case 'LOAD_SAMPLE':
      return loadSample(state, action);

    case 'LOAD_PROJECT':
      return loadProject(action);

    case 'EDIT_TONAL_CONTEXT':
      return editTonalContext(state, action.tonalContext);

    case 'EDIT_PHRASE_INTENT': {
      if (state.phraseIntent === action.phraseIntent) return state;
      return regenerate({ ...pushHistory(state), phraseIntent: action.phraseIntent });
    }

    case 'STEP_VOICE_EVENT_PITCH':
      return stepVoiceEventPitch(state, action);

    case 'TOGGLE_VOICE_EVENT_REST':
      return toggleVoiceEventRest(state, action);

    case 'INSERT_VOICE_EVENT':
      return insertVoiceEvent(state, action);

    case 'DELETE_VOICE_EVENT':
      return deleteVoiceEvent(state, action);

    case 'RESIZE_VOICE_EVENT':
      return resizeVoiceEvent(state, action);

    case 'SELECT_CANDIDATE': {
      if (state.selectedCandidateId === action.candidateId) return state;
      if (!state.candidates.some((candidate) => candidate.id === action.candidateId)) {
        return state;
      }
      return { ...pushHistory(state), selectedCandidateId: action.candidateId };
    }

    case 'TOGGLE_LOCK':
      return toggleLock(state, action.lock);

    case 'SET_TEMPO': {
      const tempoBpm = Math.min(
        MAX_TEMPO_BPM,
        Math.max(MIN_TEMPO_BPM, Math.round(action.tempoBpm)),
      );
      if (tempoBpm === state.tempoBpm) return state;
      return { ...state, tempoBpm };
    }

    case 'ADD_MEASURE':
      return addMeasure(state, action);

    case 'SELECT_MEASURE':
      return selectMeasure(state, action.appliedId);

    case 'UNDO':
      return undo(state);

    case 'REDO':
      return redo(state);

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

function workbenchReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  return syncSelectedMeasure(coreReducer(state, action));
}

export function useWorkbenchReducer(initialFixture: HarmonizationFixture) {
  return useReducer(workbenchReducer, initialFixture, createInitialWorkbenchState);
}

/** Direct access for unit tests (spec §28.1); not exported from the barrel. */
export { workbenchReducer };
