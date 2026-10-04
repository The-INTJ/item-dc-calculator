/**
 * Test support: build a position from an ASCII diagram.
 *
 *   positionFrom(`
 *     8 . . . . . . . k
 *     3 . W . T . . . .
 *     1 K . . . . . . .
 *   `, { patterns: { d3: 'R:8888' }, tiers: { d3: 0 } })
 *
 * Each row starts with its rank number; rows that are left out are empty.
 * K/T/W are White's king, tracer and warden; k/t/w are Black's. Pieces get
 * ids in reading order (`wT1`, `wT2`, …). Tracers have no tier — so no step
 * limit — unless `tiers` gives one. Rules default to TEST_RULES.
 */

import type { GameState, PatternCode, Piece, PieceKind, RuleSet, Side } from '../types';
import { rulesWith } from './rules';

const KINDS: Record<string, PieceKind> = { k: 'king', t: 'tracer', w: 'warden' };
const FILES = 'abcdefgh';

export interface PositionOptions {
  ply?: number;
  rules?: Partial<RuleSet>;
  patterns?: Record<string, string>;
  tiers?: Record<string, number>;
  lastCharted?: Partial<Record<Side, Record<string, PatternCode>>>;
  chartedKeys?: Partial<Record<Side, PatternCode[]>>;
  stepStreak?: Partial<Record<Side, number>>;
}

function parseRow(line: string): { rank: number; cells: string } | null {
  const match = /^([1-8])\s+(.+)$/.exec(line.trim());
  if (!match) return null;
  const cells = match[2].replace(/\s+/g, '');
  if (cells.length !== 8) throw new Error(`Row ${match[1]} must have 8 cells: "${line}"`);
  return { rank: Number(match[1]), cells };
}

function pieceFor(char: string, at: string, counters: Map<string, number>): Piece {
  const side: Side = char === char.toUpperCase() ? 'w' : 'b';
  const kind = KINDS[char.toLowerCase()];
  if (!kind) throw new Error(`Unknown piece letter: ${char}`);
  const letter = char.toUpperCase();
  const key = `${side}${letter}`;
  const count = (counters.get(key) ?? 0) + 1;
  counters.set(key, count);
  const id = kind === 'king' ? key : `${key}${count}`;
  return { id, side, kind, at, pattern: null, tier: null };
}

export function positionFrom(diagram: string, options: PositionOptions = {}): GameState {
  const pieces: Piece[] = [];
  const counters = new Map<string, number>();
  for (const line of diagram.split('\n')) {
    const row = parseRow(line);
    if (!row) continue;
    [...row.cells].forEach((char, file) => {
      if (char === '.') return;
      const at = `${FILES[file]}${row.rank}`;
      const piece = pieceFor(char, at, counters);
      piece.pattern = options.patterns?.[at] ?? null;
      if (piece.kind === 'tracer') piece.tier = options.tiers?.[at] ?? null;
      pieces.push(piece);
    });
  }
  return {
    rules: rulesWith(options.rules ?? {}),
    ply: options.ply ?? 0,
    pieces,
    lastCharted: { w: options.lastCharted?.w ?? {}, b: options.lastCharted?.b ?? {} },
    chartedKeys: { w: options.chartedKeys?.w ?? [], b: options.chartedKeys?.b ?? [] },
    stepStreak: { w: options.stepStreak?.w ?? 0, b: options.stepStreak?.b ?? 0 },
    result: { status: 'active' },
  };
}
