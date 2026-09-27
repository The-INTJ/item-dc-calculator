/**
 * Geometry for Moriah's gable, drawn in a 1200-wide viewBox.
 *
 * The porch gable on the building is a double rake: an outer fascia board, a
 * sliver of dark roof, and an inner rake board framing a clapboard tympanum,
 * with the round louvered vent a third of the way down. The pitch here (26°)
 * is the photo's, so the header scales with the page and keeps the shape.
 *
 * Every band is described by its vertical offset below the outer roof line,
 * which keeps each edge parallel to the pitch without any trigonometry at the
 * call sites.
 */

export const PEDIMENT_W = 1200;
const PITCH_DEG = 26;
const SLOPE = Math.tan((PITCH_DEG * Math.PI) / 180);
export const PEDIMENT_H = Math.round((PEDIMENT_W / 2) * SLOPE);

/** Vertical offsets (from the outer roof line) where each band ends. */
export const BANDS = {
  fascia: 17,
  roof: 25,
  rake: 41,
} as const;

/** The round vent, as a share of the viewBox: centre and diameter. */
export const OCULUS = {
  cx: PEDIMENT_W / 2,
  cy: BANDS.rake + (PEDIMENT_H - BANDS.rake) * 0.34,
  r: 46,
} as const;

const MID = PEDIMENT_W / 2;

/** Where the line `d` units below the roof line meets the base. */
function footX(d: number, side: -1 | 1): number {
  return round(MID + side * ((PEDIMENT_H - d) / SLOPE));
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function points(pairs: [number, number][]): string {
  return pairs.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
}

/** One rake band between two offsets, split so each slope can take its own light. */
export function rakeBand(d0: number, d1: number): { left: string; right: string } {
  return {
    left: points([
      [footX(d0, -1), PEDIMENT_H],
      [MID, d0],
      [MID, d1],
      [footX(d1, -1), PEDIMENT_H],
    ]),
    right: points([
      [MID, d0],
      [footX(d0, 1), PEDIMENT_H],
      [footX(d1, 1), PEDIMENT_H],
      [MID, d1],
    ]),
  };
}

/** The open line along an edge `d` below the roof — for highlight and shadow strokes. */
export function rakeLine(d: number): string {
  return points([
    [footX(d, -1), PEDIMENT_H],
    [MID, d],
    [footX(d, 1), PEDIMENT_H],
  ]);
}

/** The triangle inside the inner rake. */
export function tympanum(): string {
  return points([
    [footX(BANDS.rake, -1), PEDIMENT_H],
    [MID, BANDS.rake],
    [footX(BANDS.rake, 1), PEDIMENT_H],
  ]);
}
