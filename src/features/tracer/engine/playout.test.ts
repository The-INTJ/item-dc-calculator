// @vitest-environment node
/**
 * Property test: seeded random self-play. Every game must keep the engine's
 * invariants, survive a JSON round-trip with Firestore-safe data, replay
 * deterministically from its own records, and shrug off garbage input.
 */

import { describe, expect, it } from 'vitest';

import type { GameState, MainAction, Side, TurnInput, TurnRecord } from './types';
import { fileOf, neighbours, parseSquare, rankOf, vectorDigit } from './geometry';
import { freeStepSquares } from './free-step';
import { hasLegalMainAction } from './legality';
import { parsePattern } from './pattern-codes';
import { moveTargets } from './queries';
import { turnInputFromRecord } from './replay';
import { initialState } from './setup';
import { applyTurn, sideToMove } from './turn';

type Rng = () => number;

function seeded(seed: number): Rng {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function randomPath(rng: Rng, from: number, range: number): string {
  const used = new Set([from]);
  let current = from;
  let steps = '';
  const length = 1 + Math.floor(rng() * range);
  for (let i = 0; i < length; i += 1) {
    const options = neighbours(current).filter((sq) => !used.has(sq));
    if (options.length === 0) break;
    const next = pick(rng, options);
    steps += vectorDigit(fileOf(next) - fileOf(current), rankOf(next) - rankOf(current));
    used.add(next);
    current = next;
  }
  return steps;
}

function randomTurn(rng: Rng, state: GameState, side: Side): TurnInput {
  const piece = pick(rng, state.pieces.filter((p) => p.side === side));
  let main: MainAction;
  if (piece.kind === 'tracer' && (!piece.pattern || rng() < 0.5)) {
    main = { kind: 'chart', from: piece.at, steps: randomPath(rng, parseSquare(piece.at)!, piece.range ?? 8) };
  } else {
    const targets = moveTargets(state, piece.at);
    main = targets.length ? { kind: 'move', from: piece.at, to: pick(rng, targets).to } : { kind: 'pass' };
  }
  const steps = freeStepSquares(state, side);
  const wantsStep = piece.kind !== 'king' && steps.length > 0 && rng() < 0.4;
  const freeStep = wantsStep ? { to: pick(rng, steps), when: rng() < 0.5 ? 'before' : 'after' } as const : null;
  return { ply: state.ply, main, freeStep };
}


function assertFirestoreSafe(value: unknown, insideArray = false): void {
  expect(value).not.toBeUndefined();
  if (Array.isArray(value)) {
    expect(insideArray).toBe(false);
    value.forEach((item) => assertFirestoreSafe(item, true));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => assertFirestoreSafe(item, false));
  }
}

function assertInvariants(state: GameState): void {
  expect(new Set(state.pieces.map((p) => p.at)).size).toBe(state.pieces.length);
  expect(new Set(state.pieces.map((p) => p.id)).size).toBe(state.pieces.length);
  for (const side of ['w', 'b'] as const) {
    expect(state.pieces.filter((p) => p.side === side && p.kind === 'king').length).toBeLessThanOrEqual(1);
    // Each king borrows at most one pattern per Tracer of its own side.
    const lent = Object.entries(state.kingPatterns[side]);
    expect(lent.length).toBeLessThanOrEqual(3);
    for (const [tracerId, pattern] of lent) {
      expect(tracerId).toMatch(new RegExp(`^${side}T[358]$`));
      expect(parsePattern(pattern)).not.toBeNull();
    }
    for (const tracer of state.pieces.filter((p) => p.side === side && p.kind === 'tracer')) {
      expect(state.kingPatterns[side][tracer.id] ?? null).toBe(tracer.pattern);
      if (tracer.pattern?.startsWith('R:')) expect(tracer.pattern.length - 2).toBeLessThanOrEqual(tracer.range!);
    }
  }
  expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  assertFirestoreSafe(state);
  if (state.result.status === 'active') {
    expect(hasLegalMainAction(state, sideToMove(state))).toBe(true);
    expect(Math.max(state.stepStreak.w, state.stepStreak.b)).toBeLessThan(6);
  }
}

function playGame(seed: number) {
  const rng = seeded(seed);
  let state = initialState();
  const records: TurnRecord[] = [];
  while (state.result.status === 'active' && state.ply < 100) {
    const side = sideToMove(state);
    let played = false;
    for (let attempt = 0; attempt < 300 && !played; attempt += 1) {
      const outcome = applyTurn(state, side, randomTurn(rng, state, side));
      if (!outcome.ok) continue;
      records.push(outcome.record);
      assertFirestoreSafe(outcome.record);
      state = outcome.state;
      played = true;
    }
    expect(played).toBe(true);
    assertInvariants(state);
  }
  return { state, records };
}

describe('random self-play', () => {
  it('keeps every invariant and replays deterministically', () => {
    const endings = new Set<string>();
    for (let seed = 1; seed <= 100; seed += 1) {
      const { state, records } = playGame(seed);
      endings.add(state.result.status === 'won' ? state.result.reason : state.result.status);
      let replay = initialState();
      for (const record of records) {
        const outcome = applyTurn(replay, record.side, turnInputFromRecord(record)!);
        expect(outcome.ok).toBe(true);
        if (outcome.ok) replay = outcome.state;
      }
      expect(replay).toEqual(state);
    }
    expect(endings.has('king-capture')).toBe(true);
  }, 60_000);

  it('rejects garbage without throwing', () => {
    const rng = seeded(99);
    const state = initialState();
    const junk = () => pick(rng, ['', 'z9', 'd2', 'b1', '8', '55', '9'.repeat(70), '\u0000', 'R:8']);
    for (let i = 0; i < 2_000; i += 1) {
      const input = {
        ply: pick(rng, [0, 1, -1, 0.5, NaN]),
        main: pick(rng, [
          { kind: 'move', from: junk(), to: junk() },
          { kind: 'chart', from: junk(), steps: junk() },
          { kind: 'pass' },
          { kind: 'warp' },
          null,
        ]),
        freeStep: pick(rng, [null, { to: junk(), when: 'before' }, { to: junk(), when: 'later' }]),
      };
      const outcome = applyTurn(state, 'w', input as TurnInput);
      if (outcome.ok) assertInvariants(outcome.state);
    }
  });
});
