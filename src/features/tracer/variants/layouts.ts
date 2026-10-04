/**
 * Starting layouts: White's pieces, which Black mirrors across the board.
 *
 * A layout is copied into every game that uses it, and turn records name
 * pieces by these ids, so a published layout never changes — add a new one.
 * Piece order is the order pieces are placed (and listed) in a game.
 *
 * A Tracer's tier says which step limit it takes when limits are on
 * (`tracerReach.limits[tier]`): tier 0 is the shortest.
 */

import type { Layout, Placement } from '../engine';

const king = (file: string): Placement => ({ id: 'K', kind: 'king', file, row: 0, tier: null });
const tracer = (id: string, file: string, tier: number): Placement => ({ id, kind: 'tracer', file, row: 0, tier });
const warden = (id: string, file: string): Placement => ({ id, kind: 'warden', file, row: 1, tier: null });

/**
 *       a b c d e f g h
 *    8  . T . K . T . T
 *    7  . W . W . W . W
 *    2  . W . W . W . W
 *    1  . T . K . T . T      Tracer tiers: b 0, f 1, h 2
 */
export const SPACED_LAYOUT: Layout = {
  id: 'spaced',
  name: 'Spaced',
  pieces: [
    king('d'),
    tracer('T1', 'b', 0),
    tracer('T2', 'f', 1),
    tracer('T3', 'h', 2),
    warden('W1', 'b'),
    warden('W2', 'd'),
    warden('W3', 'f'),
    warden('W4', 'h'),
  ],
};

/**
 *       a b c d e f g h
 *    8  . T . T K . T .
 *    7  . W . W W . W .
 *    2  . W . W W . W .
 *    1  . T . T K . T .      Tracer tiers: b 0, g 1, d 2
 *
 * The tier-2 Tracer starts on its own colour (d1 light, d8 dark) beside the
 * king. Ids name the default limits: T3, T5, T8.
 */
export const CLASSIC_LAYOUT: Layout = {
  id: 'classic',
  name: 'Classic',
  pieces: [
    king('e'),
    tracer('T3', 'b', 0),
    tracer('T8', 'd', 2),
    tracer('T5', 'g', 1),
    warden('W1', 'b'),
    warden('W2', 'd'),
    warden('W3', 'e'),
    warden('W4', 'g'),
  ],
};

export const LAYOUTS: readonly Layout[] = [CLASSIC_LAYOUT, SPACED_LAYOUT];

export function layoutById(id: string): Layout | null {
  return LAYOUTS.find((layout) => layout.id === id) ?? null;
}
