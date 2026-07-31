/**
 * Undo/redo history: MAX_HISTORY undoable snapshots (selection included —
 * undo across a measure switch restores what you saw); drags coalesce per
 * gestureId via pushHistoryForGesture.
 */

import type { WorkbenchSnapshot, WorkbenchState } from '../../domain/workbench-state';

export const MAX_HISTORY = 50;

export function takeSnapshot(state: WorkbenchState): WorkbenchSnapshot {
  return {
    tonalContext: state.tonalContext,
    phraseIntent: state.phraseIntent,
    acceptedContext: state.acceptedContext,
    appliedFragments: state.appliedFragments,
    fragment: state.fragment,
    boundaryConstraints: state.boundaryConstraints,
    suggestionStatus: state.suggestionStatus,
    suggestionSource: state.suggestionSource,
    sourceFixtureId: state.sourceFixtureId,
    candidateSetId: state.candidateSetId,
    candidates: state.candidates,
    selectedCandidateId: state.selectedCandidateId,
    locks: state.locks,
    selectedMeasureId: state.selectedMeasureId,
  };
}

/** Snapshot the PRE-mutation state; clears the redo stack. */
export function pushHistory(state: WorkbenchState): WorkbenchState {
  return {
    ...state,
    history: [...state.history, takeSnapshot(state)].slice(-MAX_HISTORY),
    future: [],
    lastGestureId: null,
  };
}

/** Like pushHistory, but consecutive dispatches of one drag coalesce. */
export function pushHistoryForGesture(state: WorkbenchState, gestureId: string): WorkbenchState {
  if (state.lastGestureId === gestureId) {
    return { ...state, future: [] };
  }
  return { ...pushHistory(state), lastGestureId: gestureId };
}

export function undo(state: WorkbenchState): WorkbenchState {
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

export function redo(state: WorkbenchState): WorkbenchState {
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
