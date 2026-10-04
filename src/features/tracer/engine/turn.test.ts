// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { GameState, TurnInput } from './types';
import { positionFrom } from './fixtures/position';
import { TEST_RULES } from './fixtures/rules';
import { initialState } from './setup';
import { applyTurn, sideToMove } from './turn';

function move(from: string, to: string, freeStep: TurnInput['freeStep'] = null, ply = 0): TurnInput {
  return { ply, main: { kind: 'move', from, to }, freeStep };
}

function snapshot(state: GameState) {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

describe('turn guards', () => {
  const start = initialState(TEST_RULES);

  it('rejects malformed input without throwing', () => {
    for (const garbage of [null, 7, {}, { ply: 0 }, { ply: 0, main: { kind: 'fly' }, freeStep: null }]) {
      expect(applyTurn(start, 'w', garbage as never)).toMatchObject({ ok: false, code: 'BAD_INPUT' });
    }
  });

  it('rejects the wrong side, a stale ply, and a finished game', () => {
    expect(applyTurn(start, 'b', move('d7', 'd6'))).toMatchObject({ code: 'NOT_YOUR_TURN' });
    expect(applyTurn(start, 'w', move('d2', 'd3', null, 4))).toMatchObject({ code: 'STALE_PLY' });
    const over: GameState = { ...start, result: { status: 'drawn', reason: 'agreement', atPly: 0 } };
    expect(applyTurn(over, 'w', move('d2', 'd3'))).toMatchObject({ code: 'GAME_OVER' });
  });

  it('rejects moves of missing, enemy, or unformed pieces', () => {
    expect(applyTurn(start, 'w', move('e4', 'e5'))).toMatchObject({ code: 'NO_PIECE' });
    expect(applyTurn(start, 'w', move('d7', 'd6'))).toMatchObject({ code: 'NOT_YOUR_PIECE' });
    expect(applyTurn(start, 'w', move('b1', 'b3'))).toMatchObject({ code: 'UNFORMED_TRACER' });
    expect(applyTurn(start, 'w', move('d2', 'd4'))).toMatchObject({ code: 'UNREACHABLE' });
    expect(applyTurn(start, 'w', move('d2', 'z9'))).toMatchObject({ code: 'BAD_SQUARE' });
  });

  it('only lets tracers chart', () => {
    const outcome = applyTurn(start, 'w', {
      ply: 0, main: { kind: 'chart', from: 'd2', steps: '8' }, freeStep: null,
    });
    expect(outcome).toMatchObject({ code: 'NOT_A_TRACER' });
  });

  it('never lets a pass through while a move exists', () => {
    const outcome = applyTurn(start, 'w', { ply: 0, main: { kind: 'pass' }, freeStep: null });
    expect(outcome).toMatchObject({ code: 'PASS_NOT_ALLOWED' });
  });

  it('leaves the input state untouched, legal or not', () => {
    const before = snapshot(start);
    applyTurn(start, 'w', move('e2', 'e3', { to: 'e2', when: 'after' }));
    applyTurn(start, 'w', move('d2', 'd5'));
    expect(start).toEqual(before);
  });
});

describe('the free king step', () => {
  const start = initialState(TEST_RULES);

  it('may come before a warden move', () => {
    const outcome = applyTurn(start, 'w', move('b2', 'b3', { to: 'f1', when: 'before' }));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.record.actions.map((a) => a.kind)).toEqual(['step', 'warden']);
    expect(outcome.state.pieces.find((p) => p.id === 'wK')?.at).toBe('f1');
    expect(sideToMove(outcome.state)).toBe('b');
  });

  it('may come after a warden move, onto the square it vacated', () => {
    const outcome = applyTurn(start, 'w', move('d2', 'd3', { to: 'd2', when: 'after' }));
    expect(outcome.ok && outcome.record.actions.map((a) => a.kind)).toEqual(['warden', 'step']);
  });

  it('must go to an empty neighbouring square', () => {
    expect(applyTurn(start, 'w', move('b2', 'b3', { to: 'd2', when: 'before' }))).toMatchObject({
      code: 'STEP_NOT_EMPTY', phase: 'before',
    });
    expect(applyTurn(start, 'w', move('b2', 'b3', { to: 'd3', when: 'after' }))).toMatchObject({
      code: 'STEP_NOT_ADJACENT', phase: 'after',
    });
  });

  it('never comes with a king move', () => {
    expect(applyTurn(start, 'w', move('e1', 'f1', { to: 'f2', when: 'after' }))).toMatchObject({
      code: 'STEP_WITH_KING_MOVE',
    });
    // Stepping first and then moving the king from its new square is the same thing.
    expect(applyTurn(start, 'w', move('f1', 'f2', { to: 'f1', when: 'before' }))).toMatchObject({
      code: 'STEP_WITH_KING_MOVE',
    });
  });

  it('lets the king step alone as a whole king turn', () => {
    const outcome = applyTurn(start, 'w', move('e1', 'f1'));
    expect(outcome.ok && outcome.record.actions).toMatchObject([{ kind: 'king', via: 'base' }]);
  });
});

describe('captures', () => {
  it('removes the captured piece and records it', () => {
    const state = positionFrom(`
      8 . . . k . . . .
      5 . . . . w . . t
      4 . . . W . . . .
      1 . . . K . . . .
    `);
    const outcome = applyTurn(state, 'w', move('d4', 'e5'));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.record.actions[0]).toMatchObject({ kind: 'warden', captured: { kind: 'warden' } });
    expect(outcome.state.pieces.some((p) => p.at === 'e5' && p.side === 'b')).toBe(false);
    expect(outcome.state.result).toEqual({ status: 'active' });
  });
});
