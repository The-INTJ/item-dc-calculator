// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { TurnRecord } from './types';
import { formatAction, formatTurn } from './notation';
import { initialState } from './setup';
import { applyTurn } from './turn';

describe('notation', () => {
  it('writes every action form', () => {
    expect(formatAction({ kind: 'step', from: 'd8', to: 'c7' })).toBe('(Kd8-c7)');
    expect(formatAction({ kind: 'pass' })).toBe('--');
    expect(
      formatAction({
        kind: 'warden', pieceId: 'wW2', from: 'd2', to: 'e3', via: 'base', path: null,
        captured: { id: 'bW1', kind: 'warden' },
      }),
    ).toBe('Wd2xe3');
    expect(
      formatAction({
        kind: 'king', pieceId: 'wK', from: 'd1', to: 'c8', via: 'J:1,7', path: null, captured: null,
      }),
    ).toBe('Kd1-c8 [J1,7]');
    expect(
      formatAction({
        kind: 'chart', pieceId: 'wT1', from: 'b1', to: 'a8', steps: '8888887',
        pattern: 'J:-1,7', key: 'J:1,7', libraryAdded: true,
      }),
    ).toBe('Tb1~a8 J8888887*');
  });

  it('numbers turns and marks results', () => {
    const outcome = applyTurn(initialState(), 'w', {
      ply: 0, main: { kind: 'chart', from: 'b1', steps: '8888887' }, freeStep: null,
    });
    expect(outcome.ok && formatTurn(outcome.record)).toBe('1. Tb1~a8 J8888887*');
    const black: TurnRecord = {
      ply: 1,
      side: 'b',
      actions: [{ kind: 'step', from: 'd8', to: 'c7' }, {
        kind: 'strike', pieceId: 'bT1', from: 'b8', to: 'd1', via: 'J:2,7', path: null,
        captured: { id: 'wK', kind: 'king' },
      }],
      result: { status: 'won', winner: 'b', reason: 'king-capture', atPly: 1 },
    };
    expect(formatTurn(black)).toBe('1… (Kd8-c7) Tb8xd1#');
  });
});
