/**
 * Words that depend on a game's rules — piece names, limits, counts — so no
 * screen hardcodes "3-step" or "six" for a game played under other rules.
 */

import { chartLimit, hasChartLimit, stepCombinesWith, type Piece, type PieceKind, type RuleSet } from '../../engine';
import { styleById, styleLabel, tweaksBetween } from '../../variants';
import type { TracerGame } from '../types';

export const KIND_NAME: Record<PieceKind, string> = { king: 'King', tracer: 'Tracer', warden: 'Warden' };

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const ORDINAL_WORDS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

/** "six", or "12" past ten. */
export function countWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** "sixth", or "12th" past tenth. */
export function ordinalWord(n: number): string {
  if (ORDINAL_WORDS[n]) return ORDINAL_WORDS[n];
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** The step limit to show for a piece, or null when it has none. */
export function shownLimit(rules: RuleSet, piece: Pick<Piece, 'kind' | 'tier'>): number | null {
  return hasChartLimit(rules, piece) ? chartLimit(rules, piece) : null;
}

/** "3-step Tracer", "Tracer", "Warden", "King". */
export function pieceName(piece: Pick<Piece, 'kind' | 'tier'>, rules: RuleSet): string {
  const limit = shownLimit(rules, piece);
  return limit !== null ? `${limit}-step Tracer` : KIND_NAME[piece.kind];
}

const STEP_MOVERS: PieceKind[] = ['tracer', 'warden'];

/** "Tracer or Warden" — the pieces whose moves may take the free king step — or null if none may. */
export function stepCompanions(rules: RuleSet): string | null {
  const names = STEP_MOVERS.filter((kind) => stepCombinesWith(rules, kind)).map((kind) => KIND_NAME[kind]);
  return names.length > 0 ? names.join(' or ') : null;
}

/** The rules a game changed from the style it started from (none if that style is unknown here). */
export function gameTweaks(game: Pick<TracerGame, 'style' | 'state'>): (keyof RuleSet)[] {
  const style = styleById(game.style.id);
  return style ? tweaksBetween(style, game.state.rules) : [];
}

/** "Tiered (v2)", or "Tiered (v2) · 2 tweaks". */
export function gameStyleLabel(game: Pick<TracerGame, 'style' | 'state'>): string {
  return styleLabel(game.style.name, gameTweaks(game).length);
}
