'use client';

import type { Dispatch } from 'react';
import type { PhraseIntent, TonalContext } from '../domain/music-types';
import type { WorkbenchState } from '../domain/workbench-state';
import { getDefaultFixture, getFixtureById } from '../fixtures/registry';
import type { WorkbenchAction } from '../state/actions';
import { newId, newUserEventId } from './shared/ids';

/** Top-level workbench commands: history, context edits, sample loading, measure growth. */
export function useWorkbenchCommands(
  state: WorkbenchState,
  dispatch: Dispatch<WorkbenchAction>,
  dispatchStructural: (action: WorkbenchAction) => void,
) {
  const undo = () => dispatchStructural({ type: 'UNDO' });
  const redo = () => dispatchStructural({ type: 'REDO' });
  const changeTempo = (tempoBpm: number) => dispatch({ type: 'SET_TEMPO', tempoBpm });
  const changeKey = (tonalContext: TonalContext) =>
    dispatchStructural({ type: 'EDIT_TONAL_CONTEXT', tonalContext });
  const changeIntent = (phraseIntent: PhraseIntent) =>
    dispatchStructural({ type: 'EDIT_PHRASE_INTENT', phraseIntent });
  const selectCandidate = (candidateId: string) =>
    dispatch({ type: 'SELECT_CANDIDATE', candidateId });
  const selectMeasure = (appliedId: string) =>
    dispatchStructural({ type: 'SELECT_MEASURE', appliedId });

  function loadSample(fixtureId: string) {
    const fixture = getFixtureById(fixtureId);
    if (fixture) {
      dispatchStructural({
        type: 'LOAD_SAMPLE',
        source: { kind: 'fixture', fixture },
        keepAcceptedContext: false,
      });
    }
  }

  function restoreSample() {
    const fixture =
      (state.sourceFixtureId ? getFixtureById(state.sourceFixtureId) : null) ??
      getDefaultFixture();
    dispatchStructural({
      type: 'LOAD_SAMPLE',
      source: { kind: 'fixture', fixture },
      keepAcceptedContext: false,
    });
  }

  /**
   * Append a fresh measure at the end of the hymn, already holding the chord
   * the tail lands on — one beat per part (domain/next-fragment.ts). No
   * commit step: the measure being left is already synced (write-through).
   */
  function addMeasure() {
    dispatchStructural({
      type: 'ADD_MEASURE',
      appliedId: newId(),
      fragmentId: newId(),
      candidateId: newId(),
      melodyEventId: newUserEventId(),
      voiceEventIds: {
        soprano: newUserEventId(),
        alto: newUserEventId(),
        tenor: newUserEventId(),
        bass: newUserEventId(),
      },
    });
  }

  return {
    undo,
    redo,
    changeTempo,
    changeKey,
    changeIntent,
    selectCandidate,
    selectMeasure,
    loadSample,
    restoreSample,
    addMeasure,
  };
}
