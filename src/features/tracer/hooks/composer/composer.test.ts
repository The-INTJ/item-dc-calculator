// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { initialState, type GameState, type Side } from '../../engine';
import { positionFrom } from '../../engine/fixtures/position';
import { TEST_RULES } from '../../engine/fixtures/rules';
import { composerReducer, EMPTY_COMPOSER, type ComposerAction } from './composerState';
import { composeView } from './composerView';
import { interpretTap } from './interpretTap';
import { turnWarnings } from './useTurnSubmission';

// A king with a warden in front of it and a formed tracer beside it.
const BOARD = `
  8 . . . . k . . .
  2 . . . W . . . .
  1 . . . . K . . T
`;

/** Drive the composer the way the board does, without rendering. */
function session(game: GameState, side: Side | null = 'w', canMove = true) {
  let composer = EMPTY_COMPOSER;
  const view = () => composeView(game, side, canMove, composer);
  return {
    tap(...squares: string[]) {
      for (const square of squares) {
        const action = interpretTap({ composer, view: view(), canMove }, square);
        if (action) composer = composerReducer(composer, action);
      }
    },
    dispatch(action: ComposerAction) {
      composer = composerReducer(composer, action);
    },
    view,
    get composer() {
      return composer;
    },
  };
}

describe('building a piece turn', () => {
  it('stages a warden move, then a free step after it', () => {
    const s = session(initialState(TEST_RULES));
    s.tap('d2', 'd3');
    expect(s.view().turn).toEqual({ ply: 0, main: { kind: 'move', from: 'd2', to: 'd3' }, freeStep: null });
    s.tap('e1');
    expect(s.view().stepTargets).toContain('d2');
    s.tap('d2');
    expect(s.view().turn?.freeStep).toEqual({ to: 'd2', when: 'after' });
    expect(s.view().outcome?.ok).toBe(true);
  });

  it('undoes in reverse order', () => {
    const s = session(initialState(TEST_RULES));
    s.tap('d2', 'd3', 'e1', 'd2');
    s.dispatch({ type: 'undo' });
    expect(s.view().turn?.freeStep).toBeNull();
    s.dispatch({ type: 'undo' });
    expect(s.view().turn).toBeNull();
  });

  it('turns a quiet king step into the free step of a later piece move', () => {
    const s = session(initialState(TEST_RULES));
    s.tap('e1', 'f1');
    expect(s.view().turn).toEqual({ ply: 0, main: { kind: 'move', from: 'e1', to: 'f1' }, freeStep: null });
    s.tap('b2', 'b3');
    expect(s.view().turn).toEqual({
      ply: 0,
      main: { kind: 'move', from: 'b2', to: 'b3' },
      freeStep: { to: 'f1', when: 'before' },
    });
  });

  it('charts by tapping squares, backing up, and finishing', () => {
    const s = session(initialState(TEST_RULES));
    s.tap('b1');
    expect(s.composer.tracerMode).toBe('chart');
    s.tap('b2', 'b3', 'b4');
    expect(s.view().chart?.squares).toEqual(['b2', 'b3', 'b4']);
    s.tap('b4');
    expect(s.composer.chart).toBe('88');
    expect(s.view().chart).toMatchObject({ canFinish: true, kind: 'jumper' });
    s.dispatch({ type: 'stageMain', main: { kind: 'chart', from: 'b1', steps: s.composer.chart } });
    expect(s.view().outcome).toMatchObject({ ok: true });
  });
});

describe('free steps under other rules', () => {
  it('offers the free step only after moves the rules pair it with', () => {
    const s = session(positionFrom(BOARD, { rules: { freeStep: 'with-tracer' } }));
    s.tap('d2', 'd3', 'e1');
    expect(s.view()).toMatchObject({ stepWithMain: false, stepTargets: [] });
    expect(s.view().turn?.freeStep).toBeNull();
  });

  it('makes a quiet step a plain king turn when free steps are off', () => {
    const s = session(positionFrom(BOARD, { rules: { freeStep: 'off' } }));
    s.tap('e1', 'f1');
    expect(s.composer.main).toEqual({ kind: 'move', from: 'e1', to: 'f1' });
    expect(s.view().kingTurn).toBe(true);
  });

  it('after a quiet step, leaves pieces that cannot take it along inspect-only', () => {
    const s = session(positionFrom(BOARD, { rules: { freeStep: 'with-tracer' } }));
    s.tap('e1', 'f1', 'd2');
    expect(s.view().inspecting).toBe(true);
    s.tap('d3');
    expect(s.view().turn?.main).toEqual({ kind: 'move', from: 'e1', to: 'f1' });
  });
});

describe('king turns', () => {
  it('locks the turn after a king capture', () => {
    const game = positionFrom(`
      8 . . . . . . . k
      2 . . . . w . . .
      1 . . . K . . . T
    `);
    const s = session(game);
    s.tap('d1', 'e2');
    expect(s.view().kingTurn).toBe(true);
    s.tap('h1');
    expect(s.composer.selected).toBeNull();
  });
});

describe('looking around', () => {
  it('only inspects when it is not your move', () => {
    const s = session(initialState(TEST_RULES), 'b', false);
    s.tap('d2');
    expect(s.view()).toMatchObject({ inspecting: true, turn: null });
    expect(s.view().targets.map((t) => t.to)).toContain('d3');
  });

  it('inspects an enemy piece on your own move without staging anything', () => {
    const s = session(initialState(TEST_RULES));
    s.tap('d7');
    expect(s.view().inspecting).toBe(true);
    s.tap('d6');
    expect(s.view().turn).toBeNull();
  });
});

describe('turnWarnings', () => {
  it('warns before leaving the king capturable', () => {
    // A black warden already touches the king; moving elsewhere ignores it.
    const game = positionFrom(`
      8 . . . . . . . k
      2 . . . . w . . .
      1 . . . K . . . W
    `);
    const s = session(game);
    s.tap('h1', 'h2');
    expect(turnWarnings(s.view().outcome, 'w')).toEqual(['king-in-danger']);
  });

  it('warns before the step that draws the game', () => {
    const game = positionFrom('8 . . . k . . . .\n2 . W . . . . . .\n1 . . . K . . . .', { stepStreak: { w: 5 } });
    const s = session(game);
    s.tap('b2', 'b3', 'd1', 'c1');
    expect(turnWarnings(s.view().outcome, 'w')).toEqual(['streak-draw']);
  });
});
