/**
 * Workbench reducer — spec §14. House pattern (see contest auth reducer):
 * pure reducer kept module-private, exhaustive switch with no default case,
 * hook wrapper exported for the root component. The reducer and initializer
 * are also exported directly for unit tests, but stay out of the feature
 * barrel.
 *
 * Lazy initialization from the default fixture doubles as LOAD_FIXTURE: no
 * mount-time effect dispatch, fully deterministic for SSR/hydration (nothing
 * in the init path may call Date.now or crypto.randomUUID).
 */

import { useReducer } from 'react';
import type { HarmonizationFixture } from '../domain/fixture-types';
import type { WorkbenchState } from '../domain/workbench-state';
import type { WorkbenchAction } from './actions';

export const MIN_TEMPO_BPM = 40;
export const MAX_TEMPO_BPM = 200;

export function createInitialWorkbenchState(fixture: HarmonizationFixture): WorkbenchState {
  const candidateSet =
    fixture.candidateSets.find((set) => set.id === 'default') ?? fixture.candidateSets[0];
  const candidates = candidateSet ? candidateSet.candidates : [];
  return {
    tonalContext: fixture.initialState.tonalContext,
    phraseIntent: fixture.initialState.phraseIntent,
    tempoBpm: fixture.initialState.tempoBpm,
    acceptedContext: fixture.initialState.acceptedContext,
    fragment: fixture.initialState.fragment,
    boundaryConstraints: fixture.initialState.boundaryConstraints,
    suggestionStatus: candidates.length > 0 ? 'fresh' : 'empty',
    candidateSetId: candidateSet ? candidateSet.id : null,
    candidates,
    // Spec §10.1 step 7: the first candidate is preview-selected, not applied.
    selectedCandidateId: candidates.length > 0 ? candidates[0].id : null,
    locks: [],
    playback: { status: 'idle' },
    history: [],
    future: [],
  };
}

function workbenchReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'LOAD_FIXTURE':
      return createInitialWorkbenchState(action.fixture);
    case 'SELECT_CANDIDATE': {
      if (state.selectedCandidateId === action.candidateId) return state;
      if (!state.candidates.some((candidate) => candidate.id === action.candidateId)) {
        return state;
      }
      return { ...state, selectedCandidateId: action.candidateId };
    }
    case 'SET_TEMPO': {
      const tempoBpm = Math.min(
        MAX_TEMPO_BPM,
        Math.max(MIN_TEMPO_BPM, Math.round(action.tempoBpm)),
      );
      if (tempoBpm === state.tempoBpm) return state;
      return { ...state, tempoBpm };
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
