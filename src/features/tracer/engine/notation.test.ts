// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { TurnRecord } from './types';
import { formatAction, formatTurn } from './notation';
import { initialState } from './setup';
import { applyTurn } from './turn';

describe('notation', () => {
  it('writes every action form', () => {
    expect(formatAction({ kind: 'step', from: 'e8', to: 'f7' })).toBe('(Ke8-f7)');
    expect(formatAction({ kind: 'pass' })).toBe('--');
    expect(
      formatAction({
        kind: 'warden', pieceId: 'wW2', from: 'd2', to: 'e3', via: 'base', path: null,
        captured: { id: 'bW1', kind: 'warden' },
      }),
    ).toBe('Wd2xe3');
    expect(
      formatAction({
        kind: 'king', pieceId: 'wK', from: 'e1', to: 'd4', via: 'J:-1,3', path: null, captured: null,
      }),
    ).toBe('Ke1-d4 [J-1,3]');
    expect(
      formatAction({
        kind: 'chart', pieceId: 'wT3', from: 'b1', to: 'b3', steps: '88', pattern: 'J:0,2',
      }),
    ).toBe('Tb1~b3 J88');
  });

  it('numbers turns and marks results', () => {
    const outcome = applyTurn(initialState(), 'w', {
      ply: 0, main: { kind: 'chart', from: 'b1', steps: '88' }, freeStep: null,
    });
    expect(outcome.ok && formatTurn(outcome.record)).toBe('1. Tb1~b3 J88');
    const black: TurnRecord = {
      ply: 1,
      side: 'b',
      actions: [{ kind: 'step', from: 'e8', to: 'f7' }, {
        kind: 'strike', pieceId: 'bT3', from: 'b8', to: 'e1', via: 'J:3,7', path: null,
        captured: { id: 'wK', kind: 'king' },
      }],
      result: { status: 'won', winner: 'b', reason: 'king-capture', atPly: 1 },
    };
    expect(formatTurn(black)).toBe('1… (Ke8-f7) Tb8xe1#');
  });
});
