/**
 * Upcasting stored positions to the current shape, where every position
 * carries its own rules. Pure functions over plain JSON, run before the
 * schema check: anything unrecognised passes through untouched, and the
 * schema then rejects it.
 *
 *   rulesVersion 1 (Original): rules = Original (v1); the king's `library`
 *     becomes `chartedKeys`; each living Tracer's pattern seeds
 *     `lastCharted` (v1 never recorded captured Tracers' patterns, and the
 *     Original rules never read them).
 *   rulesVersion 2 (Tiered): rules = Tiered (v2) as the local-only branch
 *     played it — six free steps in a row drew, threatened or not (so these
 *     games read as "Tiered (v2) · 2 tweaks"); `range` becomes `tier`;
 *     the king's per-Tracer `kingPatterns` are exactly `lastCharted`.
 *     `chartedKeys` is rebuilt from the turn list when there is one (local
 *     games), else from the patterns the king held.
 */

import { canonicalKey, parsePattern, type Layout, type PatternCode, type RuleSet, type Side } from '../../../engine';
import { ORIGINAL_V1, TIERED_V2 } from '../../../variants';

/** Tiered (v2) as the v2 branch played it, before dodges needed a threat. */
export const TIERED_V2_AS_PLAYED: RuleSet = { ...TIERED_V2.rules, dodgeDraw: 6, dodgeNeedsThreat: false };

export type Json = Record<string, unknown>;

export function isJson(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A piece's tier under `layout`, found by its id without the side prefix. */
function tierOf(layout: Layout, piece: Json): number | null {
  const id = piece.id;
  if (piece.kind !== 'tracer' || typeof id !== 'string') return null;
  return layout.pieces.find((placement) => placement.id === id.slice(1))?.tier ?? null;
}

function withTiers(pieces: unknown, layout: Layout): unknown {
  if (!Array.isArray(pieces)) return pieces;
  return pieces.map((piece: unknown) => {
    if (!isJson(piece)) return piece;
    const { range: _range, ...rest } = piece;
    return { ...rest, tier: tierOf(layout, piece) };
  });
}

function perSide<T>(build: (side: Side) => T): Record<Side, T> {
  return { w: build('w'), b: build('b') };
}

/** Each living Tracer's pattern on `side`, by Tracer id. */
function livingPatterns(pieces: unknown, side: Side): Record<string, PatternCode> {
  const patterns: Record<string, PatternCode> = {};
  if (!Array.isArray(pieces)) return patterns;
  for (const piece of pieces) {
    if (isJson(piece) && piece.side === side && piece.kind === 'tracer' && typeof piece.pattern === 'string') {
      patterns[String(piece.id)] = piece.pattern;
    }
  }
  return patterns;
}

/** The readable codes in `codes`, first occurrence first. */
function codesOf(codes: unknown[]): PatternCode[] {
  return [...new Set(codes.filter((code): code is string => parsePattern(code) !== null))];
}

/** Canonical keys of `codes`, first occurrence first, skipping anything unreadable. */
function keysOf(codes: unknown[]): PatternCode[] {
  return [...new Set(codesOf(codes).map(canonicalKey))];
}

/** Every pattern each side charted, in order, read from a list of turn records. */
function chartedFromTurns(turns: unknown[]): Record<Side, unknown[]> {
  return perSide((side) =>
    turns.flatMap((turn) => {
      if (!isJson(turn) || turn.side !== side || !Array.isArray(turn.actions)) return [];
      return turn.actions.filter((action) => isJson(action) && action.kind === 'chart').map((action) => action.pattern);
    }),
  );
}

function upcastV1(state: Json): Json {
  const { rulesVersion: _version, library, ...rest } = state;
  const rules = ORIGINAL_V1.rules;
  return {
    ...rest,
    rules,
    pieces: withTiers(state.pieces, rules.layout),
    lastCharted: perSide((side) => livingPatterns(state.pieces, side)),
    chartedKeys: library,
  };
}

function upcastV2(state: Json, turns: unknown[] | null): Json {
  const { rulesVersion: _version, kingPatterns, ...rest } = state;
  const rules = TIERED_V2_AS_PLAYED;
  const lent = isJson(kingPatterns) ? kingPatterns : {};
  const held = (side: Side) => (isJson(lent[side]) ? (lent[side] as Json) : {});
  const charted = turns
    ? chartedFromTurns(turns)
    : perSide((side) => Object.keys(held(side)).sort().map((id) => held(side)[id]));
  return {
    ...rest,
    rules,
    pieces: withTiers(state.pieces, rules.layout),
    lastCharted: kingPatterns,
    chartedKeys: perSide((side) => keysOf(charted[side])),
    chartedCodes: perSide((side) => codesOf(charted[side])),
  };
}

/** The stored position in the current shape. `turns` (when known) fills in what old shapes never kept. */
export function upcastState(state: unknown, turns: unknown[] | null = null): unknown {
  if (!isJson(state)) return state;
  if (state.rulesVersion === 1) return upcastV1(state);
  if (state.rulesVersion === 2) return upcastV2(state, turns);
  return state;
}
