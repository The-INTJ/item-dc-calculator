/**
 * Which shape a note wears, and which outline draws it.
 *
 * The shape follows the note's DEGREE, never its syllable string. Two reasons:
 * the syllable of a degree moves with the mode (degree 1 is do in major, la in
 * la-based minor), and this workbench writes si for a raised fifth, where older
 * seven-shape books write si for the seventh. Reading the string would put the
 * wrong shape under a raised note; reading the degree cannot.
 *
 * A chromatic inflection keeps its degree's shape and prints an accidental —
 * a raised sol (si) is still a round head with a sharp beside it.
 */

import type { DiatonicDegree, SolfegeSyllable, TonalContext } from '../music-types';
import { syllableForDegree } from '../scale';
import type { BravuraGlyphId } from './bravura-glyphs';
import type { NotatedBase, ShapeId, StemDirection } from './staff-types';

/** The seven degrees in scale order, for walking a key's shapes. */
export const DIATONIC_DEGREES: DiatonicDegree[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * Aikin's seven shapes, keyed by the syllable each degree carries when the mode
 * is read from its own tonic. Only the seven naturals appear: a chromatic
 * borrows its degree's shape.
 */
const SHAPE_BY_BASE_SYLLABLE: Partial<Record<SolfegeSyllable, ShapeId>> = {
  do: 'triangleUp',
  re: 'moon',
  mi: 'diamond',
  fa: 'triangleSide',
  sol: 'round',
  la: 'square',
  ti: 'triangleRound',
};

/** The shape for a degree in a key; null when the context's mode is unsupported. */
export function shapeForDegree(
  context: TonalContext,
  degree: DiatonicDegree,
): ShapeId | null {
  const base = syllableForDegree(context, degree, 0);
  if (!base) return null;
  return SHAPE_BY_BASE_SYLLABLE[base] ?? null;
}

/** Half notes and longer are drawn open; quarters and shorter are filled in. */
export function isHollow(base: NotatedBase): boolean {
  return base === 'w' || base === 'h';
}

interface HeadPair {
  hollow: BravuraGlyphId;
  filled: BravuraGlyphId;
}

const FIXED_HEADS: Record<Exclude<ShapeId, 'triangleSide'>, HeadPair> = {
  triangleUp: { hollow: 'noteShapeTriangleUpWhite', filled: 'noteShapeTriangleUpBlack' },
  moon: { hollow: 'noteShapeMoonWhite', filled: 'noteShapeMoonBlack' },
  diamond: { hollow: 'noteShapeDiamondWhite', filled: 'noteShapeDiamondBlack' },
  round: { hollow: 'noteShapeRoundWhite', filled: 'noteShapeRoundBlack' },
  square: { hollow: 'noteShapeSquareWhite', filled: 'noteShapeSquareBlack' },
  triangleRound: {
    hollow: 'noteShapeTriangleRoundWhite',
    filled: 'noteShapeTriangleRoundBlack',
  },
};

/**
 * fa's upright edge sits against the stem, so the triangle mirrors: a stem-up fa
 * points left (upright edge on the right, where the stem rises) and a stem-down
 * fa points right.
 */
const FA_HEADS: Record<StemDirection, HeadPair> = {
  up: { hollow: 'noteShapeTriangleLeftWhite', filled: 'noteShapeTriangleLeftBlack' },
  down: { hollow: 'noteShapeTriangleRightWhite', filled: 'noteShapeTriangleRightBlack' },
};

function headPair(shape: ShapeId, stem: StemDirection): HeadPair {
  return shape === 'triangleSide' ? FA_HEADS[stem] : FIXED_HEADS[shape];
}

/** The outline for a notehead: its shape, whether it is open or filled, and its stem side. */
export function headGlyph(
  shape: ShapeId,
  base: NotatedBase,
  stem: StemDirection,
): BravuraGlyphId {
  const pair = headPair(shape, stem);
  return isHollow(base) ? pair.hollow : pair.filled;
}
