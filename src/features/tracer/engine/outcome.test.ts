// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { TurnInput } from './types';
import { positionFrom } from './fixtures/position';
import { agreeDraw, resign } from './outcome';
import { applyTurn } from './turn';

function wardenMove(from: string, to: string, step: TurnInput['freeStep'] = null, ply = 0): TurnInput {
  return { ply, main: { kind: 'move', from, to }, freeStep: step };
}

describe('winning', () => {
  it('wins on capturing the king, whatever captures it', () => {
    const state = positionFrom(`
      8 . . . . . . . t
      5 . . . . k . . .
      4 . . . W . . . .
      1 . . . K . . . .
    `);
    const outcome = applyTurn(state, 'w', wardenMove('d4', 'e5'));
    expect(outcome.ok && outcome.state.result).toEqual({
      status: 'won', winner: 'w', reason: 'king-capture', atPly: 0,
    });
  });

  it('wins when a capture leaves only the enemy king', () => {
    const state = positionFrom(`
      8 . . . . . . . k
      5 . . . . w . . .
      4 . . . W . . . .
      1 . . . K . . . .
    `);
    const outcome = applyTurn(state, 'w', wardenMove('d4', 'e5'));
    expect(outcome.ok && outcome.state.result).toMatchObject({ status: 'won', reason: 'lone-king' });
  });

  it('keeps playing while the enemy has any other piece', () => {
    const state = positionFrom(`
      8 . . . . . . t k
      5 . . . . w . . .
      4 . . . W . . . .
      1 . . . K . . . .
    `);
    const outcome = applyTurn(state, 'w', wardenMove('d4', 'e5'));
    expect(outcome.ok && outcome.state.result).toEqual({ status: 'active' });
  });

  it('refuses a free step after the winning capture', () => {
    const state = positionFrom(`
      5 . . . . k . . .
      4 . . . W . . . .
      1 . . . K . . . .
    `);
    expect(applyTurn(state, 'w', wardenMove('d4', 'e5', { to: 'c1', when: 'after' }))).toMatchObject({
      ok: false, code: 'STEP_AFTER_WIN',
    });
  });
});

describe('the dodge streak', () => {
  const board = `
    8 . . . k . . . .
    7 . . . w . . . .
    2 . W . . . . . .
    1 . . . K . . . .
  `;

  it('draws on the sixth consecutive free step with no capture', () => {
    const state = positionFrom(board, { stepStreak: { w: 5 } });
    const outcome = applyTurn(state, 'w', wardenMove('b2', 'b3', { to: 'c1', when: 'before' }));
    expect(outcome.ok && outcome.state.result).toEqual({
      status: 'drawn', reason: 'step-streak', atPly: 0,
    });
  });

  it('counts up only the mover, and resets without a step', () => {
    const state = positionFrom(board, { stepStreak: { w: 3, b: 2 } });
    const stepped = applyTurn(state, 'w', wardenMove('b2', 'b3', { to: 'c1', when: 'after' }));
    expect(stepped.ok && stepped.state.stepStreak).toEqual({ w: 4, b: 2 });
    const plain = applyTurn(state, 'w', wardenMove('b2', 'b3'));
    expect(plain.ok && plain.state.stepStreak).toEqual({ w: 0, b: 2 });
  });

  it('resets both counts on any capture', () => {
    const state = positionFrom(
      `
      8 . . . k . . . .
      3 . . w . . . . t
      2 . W . . . . . .
      1 . . . K . . . .
      `,
      { stepStreak: { w: 5, b: 4 } },
    );
    const outcome = applyTurn(state, 'w', wardenMove('b2', 'c3', { to: 'e1', when: 'after' }));
    expect(outcome.ok && outcome.state.stepStreak).toEqual({ w: 0, b: 0 });
    expect(outcome.ok && outcome.state.result).toEqual({ status: 'active' });
  });
});

describe('resignation and agreement', () => {
  const state = positionFrom('8 . . . k . . . .\n1 . . . K . . . .', { ply: 7 });

  it('gives the game to the other side on resignation', () => {
    expect(resign(state, 'b').result).toEqual({
      status: 'won', winner: 'w', reason: 'resignation', atPly: 7,
    });
  });

  it('records an agreed draw', () => {
    expect(agreeDraw(state).result).toEqual({ status: 'drawn', reason: 'agreement', atPly: 7 });
  });

  it('cannot change a finished game', () => {
    const finished = agreeDraw(state);
    expect(resign(finished, 'w')).toBe(finished);
  });
});
