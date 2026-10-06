/**
 * Test support: seeded random self-play that only proposes what the engine
 * says is legal (charts are drawn through previewChart, free steps offered
 * only where the rules allow them), plus the invariants every position must
 * keep under ANY rule set. Shared by the engine and variants tests, so a new
 * rule or game style is exercised without writing a new test.
 */

import { expect } from 'vitest';

import type { ActionRecord, GameState, MainAction, Piece, PieceKind, RuleSet, Side, TurnInput, TurnRecord } from '../types';
import { previewChart } from '../chart';
import { freeStepSquares } from '../free-step';
import { hasLegalMainAction } from '../legality';
import { parsePattern } from '../pattern-codes';
import { moveTargets, stepDigit } from '../queries';
import { replayTurns } from '../replay';
import { chartLimit, dodgeLimit, kingDeclares, kingPatterns, landsAnywhere, stepCombinesWith } from '../rulebook';
import { initialState } from '../setup';
import { applyTurn, sideToMove } from '../turn';

export type Rng = () => number;

export function seeded(seed: number): Rng {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function randomChart(rng: Rng, state: GameState, from: string): MainAction {
  let steps = '';
  const length = 1 + Math.floor(rng() * 10);
  for (let i = 0; i < length; i += 1) {
    const preview = previewChart(state, from, steps);
    if (preview.next.length === 0) break;
    const last = preview.squares.length > 0 ? preview.squares[preview.squares.length - 1] : from;
    steps += stepDigit(last, pick(rng, preview.next)) ?? '';
  }
  if (!landsAnywhere(state.rules)) return { kind: 'chart', from, steps };
  // Stop anywhere legal along the path: where it started, or any empty square on it.
  const squares = previewChart(state, from, steps).squares;
  const stops = [0, ...squares.flatMap((square, index) => (state.pieces.some((p) => p.at === square) ? [] : [index + 1]))];
  return { kind: 'chart', from, steps, land: pick(rng, stops) };
}

function randomKingAction(rng: Rng, state: GameState, king: Piece): MainAction {
  const pool = kingDeclares(state.rules) ? kingPatterns(state, king.side) : [];
  if (pool.length > 0 && rng() < 0.4) return { kind: 'declare', pattern: pick(rng, pool) };
  const targets = moveTargets(state, king.at);
  return targets.length ? { kind: 'move', from: king.at, to: pick(rng, targets).to } : { kind: 'pass' };
}

export function randomTurn(rng: Rng, state: GameState, side: Side): TurnInput {
  const mine = state.pieces.filter((p) => p.side === side);
  const others = mine.filter((p) => p.kind !== 'king');
  const piece = rng() < 0.2 || others.length === 0 ? mine.find((p) => p.kind === 'king')! : pick(rng, others);
  let main: MainAction;
  if (piece.kind === 'king') {
    main = randomKingAction(rng, state, piece);
  } else if (piece.kind === 'tracer' && (!piece.pattern || rng() < 0.5)) {
    main = randomChart(rng, state, piece.at);
  } else {
    const targets = moveTargets(state, piece.at);
    main = targets.length ? { kind: 'move', from: piece.at, to: pick(rng, targets).to } : { kind: 'pass' };
  }
  const steps = stepCombinesWith(state.rules, piece.kind) ? freeStepSquares(state, side) : [];
  const freeStep = steps.length > 0 && rng() < 0.4 ? { to: pick(rng, steps), when: rng() < 0.5 ? 'before' : 'after' } as const : null;
  return { ply: state.ply, main, freeStep };
}

export function assertFirestoreSafe(value: unknown, insideArray = false): void {
  expect(value).not.toBeUndefined();
  if (Array.isArray(value)) {
    expect(insideArray).toBe(false);
    value.forEach((item) => assertFirestoreSafe(item, true));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => assertFirestoreSafe(item, false));
  }
}

const MOVER: Partial<Record<ActionRecord['kind'], PieceKind>> = {
  chart: 'tracer',
  strike: 'tracer',
  warden: 'warden',
  king: 'king',
  declare: 'king',
};

/** A recorded free step only ever rides along with a move the rules allow it with. */
function assertStepAllowed(rules: RuleSet, record: TurnRecord): void {
  if (!record.actions.some((action) => action.kind === 'step')) return;
  const main = record.actions.find((action) => action.kind !== 'step');
  const kind = main ? MOVER[main.kind] : undefined;
  expect(kind !== undefined && kind !== 'king' && stepCombinesWith(rules, kind)).toBe(true);
}

export function assertInvariants(state: GameState): void {
  expect(new Set(state.pieces.map((p) => p.at)).size).toBe(state.pieces.length);
  expect(new Set(state.pieces.map((p) => p.id)).size).toBe(state.pieces.length);
  for (const side of ['w', 'b'] as const) {
    expect(state.pieces.filter((p) => p.side === side && p.kind === 'king').length).toBeLessThanOrEqual(1);
    expect(new Set(state.chartedKeys[side]).size).toBe(state.chartedKeys[side].length);
    expect(new Set(state.chartedCodes[side]).size).toBe(state.chartedCodes[side].length);
    [...state.chartedKeys[side], ...state.chartedCodes[side], ...Object.values(state.lastCharted[side])].forEach((code) =>
      expect(parsePattern(code)).not.toBeNull(),
    );
    // Kings hold a pattern only where they declare one.
    for (const king of state.pieces.filter((p) => p.side === side && p.kind === 'king')) {
      if (!kingDeclares(state.rules)) expect(king.pattern).toBeNull();
      else if (king.pattern) expect(parsePattern(king.pattern)).not.toBeNull();
    }
    for (const tracer of state.pieces.filter((p) => p.side === side && p.kind === 'tracer')) {
      expect(state.lastCharted[side][tracer.id] ?? null).toBe(tracer.pattern);
      const steps = tracer.pattern?.startsWith('R:') ? tracer.pattern.length - 2 : 0;
      expect(steps).toBeLessThanOrEqual(chartLimit(state.rules, tracer));
    }
  }
  expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  assertFirestoreSafe(state);
  if (state.result.status === 'active') {
    expect(hasLegalMainAction(state, sideToMove(state))).toBe(true);
    const limit = dodgeLimit(state.rules);
    if (limit !== null) expect(Math.max(state.stepStreak.w, state.stepStreak.b)).toBeLessThan(limit);
  }
}

/** Play one seeded game under `rules`, checking invariants after every turn. */
export function playGame(rules: RuleSet, seed: number, maxPly: number) {
  const rng = seeded(seed);
  let state = initialState(rules);
  const records: TurnRecord[] = [];
  while (state.result.status === 'active' && state.ply < maxPly) {
    const side = sideToMove(state);
    let played = false;
    for (let attempt = 0; attempt < 300 && !played; attempt += 1) {
      const outcome = applyTurn(state, side, randomTurn(rng, state, side));
      if (!outcome.ok) continue;
      assertStepAllowed(rules, outcome.record);
      assertFirestoreSafe(outcome.record);
      records.push(outcome.record);
      state = outcome.state;
      played = true;
    }
    expect(played).toBe(true);
    assertInvariants(state);
  }
  expect(replayTurns(rules, records)).toEqual(state);
  return { state, records };
}
