'use client';

import { useReducer } from 'react';

import { landsAnywhere, type SquareName } from '../../engine';
import type { Viewer } from '../../lib/policy';
import type { TracerGame } from '../../lib/types';
import { composerReducer, EMPTY_COMPOSER } from './composerState';
import { composeView } from './composerView';
import { interpretTap } from './interpretTap';

/**
 * Local state for the turn being built. The owning component is keyed by
 * ply, so a new turn (or a snapshot from the other player) starts fresh.
 */
export function useTurnComposer(game: TracerGame, viewer: Viewer) {
  const [composer, dispatch] = useReducer(composerReducer, EMPTY_COMPOSER);
  const view = composeView(game.state, viewer.actingSide, viewer.canMove, composer);

  function tap(square: SquareName) {
    const action = interpretTap({ composer, view, canMove: viewer.canMove }, square);
    if (action) dispatch(action);
  }

  /** Done drawing: stage the chart — or, where charts may stop anywhere, ask where. */
  function finishChart() {
    if (!view.chart?.canFinish || !composer.selected) return;
    if (landsAnywhere(game.state.rules)) dispatch({ type: 'pickLanding' });
    else dispatch({ type: 'stageMain', main: { kind: 'chart', from: composer.selected, steps: composer.chart } });
  }

  return { composer, view, dispatch, tap, finishChart };
}
