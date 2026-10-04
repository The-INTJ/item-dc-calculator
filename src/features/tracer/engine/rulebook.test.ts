// @vitest-environment node
/**
 * One table per rule switch, checked through the engine's behaviour rather
 * than the switch itself: if a rule is honoured in one place and forgotten in
 * another, a row here fails.
 */

import { describe, expect, it } from 'vitest';

import type { FreeStepRule, KingMemory, MainAction, RuleSet } from './types';
import { positionFrom } from './fixtures/position';
import { previewChart } from './chart';
import { canonicalKey } from './pattern-codes';
import { moveTargets } from './queries';
import { FREE_STEP, kingPatterns } from './rulebook';
import { attackedSquares } from './threats';
import { applyTurn } from './turn';

const SERPENTINE = ('6666666' + '8' + '4444444' + '8').repeat(4).slice(0, 63);

describe('tracerReach: the step-limit gate', () => {
  const limits = [3, 5, 8];
  it.each<[string, RuleSet['tracerReach'], number | null, number | null]>([
    ['tier 0 of 3/5/8', { limited: true, limits }, 0, 3],
    ['tier 2 of 3/5/8', { limited: true, limits }, 2, 8],
    ['a tier whose limit is unset', { limited: true, limits: [3, null, 8] }, 1, null],
    ['a tier past the end of the list', { limited: true, limits: [3] }, 2, null],
    ['limits switched off', { limited: false, limits }, 0, null],
    ['a Tracer with no tier', { limited: true, limits }, null, null],
  ])('%s', (_label, tracerReach, tier, limit) => {
    const state = positionFrom('1 T . . . . . . .', { rules: { tracerReach }, tiers: tier === null ? {} : { a1: tier } });
    const chart = (length: number) =>
      applyTurn(state, 'w', { ply: 0, main: { kind: 'chart', from: 'a1', steps: SERPENTINE.slice(0, length) }, freeStep: null });
    expect(previewChart(state, 'a1', '').limit).toBe(limit);
    expect(chart(limit ?? 63)).toMatchObject({ ok: true });
    if (limit !== null) expect(chart(limit + 1)).toMatchObject({ ok: false, code: 'CHART_TOO_LONG' });
  });
});

describe('kingMemory: where the king’s patterns come from', () => {
  // wT1 (b2) holds J:0,3 and wT2 (h1) holds R:88; wT2 once charted J:1,2.
  // Black's warden then captures wT1.
  function afterCapture(kingMemory: KingMemory) {
    const state = positionFrom(
      `
      8 . . . . . . . k
      3 . . w . . . . .
      2 . T . . . . . .
      1 . . . . K . . T
      `,
      {
        ply: 1,
        rules: { kingMemory },
        patterns: { b2: 'J:0,3', h1: 'R:88' },
        lastCharted: { w: { wT1: 'J:0,3', wT2: 'R:88' } },
        chartedKeys: { w: ['J:1,2', 'J:0,3', 'R:88'].map(canonicalKey) },
      },
    );
    const outcome = applyTurn(state, 'b', { ply: 1, main: { kind: 'move', from: 'c3', to: 'b2' }, freeStep: null });
    if (!outcome.ok) throw new Error(outcome.code);
    return outcome.state;
  }

  it.each<[KingMemory, string[]]>([
    ['none', []],
    ['current', ['R:88']],
    ['current-kept', ['J:0,3', 'R:88']],
    ['every-chart', ['J:1,2', 'J:0,3', 'R:88']],
  ])('%s', (kingMemory, patterns) => {
    const state = afterCapture(kingMemory);
    expect(kingPatterns(state, 'w')).toEqual(patterns);
    const vias = new Set(moveTargets(state, 'e1').map((target) => target.via));
    expect(vias).toEqual(new Set(['base', ...patterns]));
  });
});

describe('freeStep: which moves the king’s free step rides with', () => {
  const COMBINES: Record<FreeStepRule, { tracer: boolean; warden: boolean }> = {
    off: { tracer: false, warden: false },
    'with-tracer': { tracer: true, warden: false },
    'with-tracer-or-warden': { tracer: true, warden: true },
  };

  describe.each(FREE_STEP)('%s', (freeStep) => {
    const allowed = COMBINES[freeStep];
    // The king on d2 blocks the d1 rider's line to d5, and the d1 warden's step to d2.
    const state = positionFrom(
      `
      8 . . . . . . . k
      5 . . . w . . . .
      2 . . . K . . . .
      1 . . . T . . W .
      `,
      { rules: { freeStep }, patterns: { d1: 'R:8888' } },
    );
    const withStep = (main: MainAction) =>
      applyTurn(state, 'w', { ply: 0, main, freeStep: { to: 'c3', when: 'after' } });
    const verdict = (ok: boolean) => (ok ? { ok: true } : { ok: false, code: 'STEP_NOT_ALLOWED' });

    it('allows the step only with the moves the rule names', () => {
      expect(withStep({ kind: 'chart', from: 'd1', steps: '6' })).toMatchObject(verdict(allowed.tracer));
      expect(withStep({ kind: 'move', from: 'd1', to: 'e1' })).toMatchObject(verdict(allowed.tracer));
      expect(withStep({ kind: 'move', from: 'g1', to: 'g2' })).toMatchObject(verdict(allowed.warden));
      expect(withStep({ kind: 'move', from: 'd2', to: 'd3' })).toMatchObject({ code: 'STEP_WITH_KING_MOVE' });
    });

    it('counts lines a step would open only for pieces that may take it', () => {
      expect(attackedSquares(state, 'w').includes('d5')).toBe(allowed.tracer);
      const warden = positionFrom('8 . . . . . . . k\n2 . . . K . . . .\n1 . . . W . . . .', { rules: { freeStep } });
      expect(attackedSquares(warden, 'w').includes('d2')).toBe(allowed.warden);
    });
  });
});

describe('loneKingWins', () => {
  it.each([
    [true, { status: 'won', winner: 'w', reason: 'lone-king', atPly: 0 }],
    [false, { status: 'active' }],
  ])('%s', (loneKingWins, result) => {
    const state = positionFrom('8 . . . . . . . k\n5 . . . . w . . .\n4 . . . W . . . .\n1 . . . K . . . .', {
      rules: { loneKingWins },
    });
    const outcome = applyTurn(state, 'w', { ply: 0, main: { kind: 'move', from: 'd4', to: 'e5' }, freeStep: null });
    expect(outcome.ok && outcome.state.result).toEqual(result);
  });
});

describe('dodgeDraw', () => {
  it.each([
    [0, 20, 'active'],
    [3, 1, 'active'],
    [3, 2, 'drawn'],
    [6, 4, 'active'],
    [6, 5, 'drawn'],
  ])('a limit of %i, after %i free steps in a row, leaves one more step %s', (dodgeDraw, streak, status) => {
    const state = positionFrom('8 . . . k . . . .\n7 . . . w . . . .\n2 . W . . . . . .\n1 . . . K . . . .', {
      rules: { dodgeDraw },
      stepStreak: { w: streak },
    });
    const outcome = applyTurn(state, 'w', {
      ply: 0, main: { kind: 'move', from: 'b2', to: 'b3' }, freeStep: { to: 'c1', when: 'before' },
    });
    expect(outcome.ok && outcome.state.result.status).toBe(status);
  });
});
