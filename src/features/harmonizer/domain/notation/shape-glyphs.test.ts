import { describe, expect, it } from 'vitest';
import type { DiatonicDegree, TonalContext } from '../music-types';
import { bravuraGlyphs, type BravuraGlyphId } from './bravura-glyphs';
import { DIATONIC_DEGREES, headGlyph, isHollow, shapeForDegree } from './shape-glyphs';
import { NOTATED_BASES, REST_GLYPHS, flagGlyph } from './engraving-paths';
import type { ShapeId } from './staff-types';

const C_MAJOR: TonalContext = {
  tonic: { letter: 'C', accidental: 'natural', pitchClass: 0 },
  tonicPitchClass: 0,
  mode: 'major',
  solfegeSystem: 'movable_do',
};

const A_MINOR: TonalContext = {
  tonic: { letter: 'A', accidental: 'natural', pitchClass: 9 },
  tonicPitchClass: 9,
  mode: 'natural_minor',
  minorDoSystem: 'la_based',
  solfegeSystem: 'movable_do',
};

const UNSUPPORTED: TonalContext = { ...A_MINOR, minorDoSystem: 'do_based' };

function shapes(context: TonalContext): (ShapeId | null)[] {
  return DIATONIC_DEGREES.map((degree) => shapeForDegree(context, degree));
}

describe('shapeForDegree', () => {
  it('walks the seven Aikin shapes up a major scale', () => {
    expect(shapes(C_MAJOR)).toEqual([
      'triangleUp', // do
      'moon', // re
      'diamond', // mi
      'triangleSide', // fa
      'round', // sol
      'square', // la
      'triangleRound', // ti
    ]);
  });

  it('rotates with la-based minor, so the tonic wears la‘s square', () => {
    expect(shapes(A_MINOR)).toEqual([
      'square', // la
      'triangleRound', // ti
      'triangleUp', // do
      'moon', // re
      'diamond', // mi
      'triangleSide', // fa
      'round', // sol
    ]);
  });

  it('reads the degree, not the syllable, so a raised fifth keeps sol‘s round head', () => {
    // This workbench writes si for a raised sol, where older seven-shape books
    // write si for the seventh. A shape derived from the string would land on
    // ti's cone; derived from the degree it stays round.
    expect(shapeForDegree(C_MAJOR, 5)).toBe('round');
    expect(shapeForDegree(A_MINOR, 7)).toBe('round');
  });

  it('has no shape for an unsupported mode', () => {
    expect(shapes(UNSUPPORTED)).toEqual(DIATONIC_DEGREES.map(() => null));
  });

  it('covers every degree the type allows', () => {
    const expected: DiatonicDegree[] = [1, 2, 3, 4, 5, 6, 7];
    expect(DIATONIC_DEGREES).toEqual(expected);
  });
});

describe('headGlyph', () => {
  it('opens the head for half notes and longer, fills it for quarters and shorter', () => {
    expect(NOTATED_BASES.map(isHollow)).toEqual([true, true, false, false, false]);
    expect(headGlyph('round', 'h', 'up')).toBe('noteShapeRoundWhite');
    expect(headGlyph('round', 'q', 'up')).toBe('noteShapeRoundBlack');
  });

  it('mirrors fa so its upright edge stays on the stem side', () => {
    expect(headGlyph('triangleSide', 'q', 'up')).toBe('noteShapeTriangleLeftBlack');
    expect(headGlyph('triangleSide', 'q', 'down')).toBe('noteShapeTriangleRightBlack');
    expect(headGlyph('triangleSide', 'w', 'up')).toBe('noteShapeTriangleLeftWhite');
    expect(headGlyph('triangleSide', 'w', 'down')).toBe('noteShapeTriangleRightWhite');
  });

  it('leaves every other shape unmirrored', () => {
    const fixed: ShapeId[] = ['triangleUp', 'moon', 'diamond', 'round', 'square', 'triangleRound'];
    for (const shape of fixed) {
      expect(headGlyph(shape, 'q', 'up')).toBe(headGlyph(shape, 'q', 'down'));
    }
  });
});

describe('flagGlyph', () => {
  it('flags only eighths and sixteenths', () => {
    expect(NOTATED_BASES.map((base) => flagGlyph(base, 'up'))).toEqual([
      null,
      null,
      null,
      'flag8thUp',
      'flag16thUp',
    ]);
  });

  it('turns the flag with the stem', () => {
    expect(flagGlyph('e', 'down')).toBe('flag8thDown');
    expect(flagGlyph('s', 'down')).toBe('flag16thDown');
  });
});

describe('the embedded outlines', () => {
  const ids = Object.keys(bravuraGlyphs) as BravuraGlyphId[];

  it('every glyph the shape and furniture tables name is present', () => {
    const named: BravuraGlyphId[] = [
      ...NOTATED_BASES.map((base) => REST_GLYPHS[base]),
      ...(['e', 's'] as const).flatMap((base) => [
        flagGlyph(base, 'up'),
        flagGlyph(base, 'down'),
      ]),
    ].filter((glyph): glyph is BravuraGlyphId => glyph !== null);
    for (const id of named) {
      expect(bravuraGlyphs[id]).toBeDefined();
    }
  });

  it('carries a drawable outline and a positive box for each', () => {
    for (const id of ids) {
      const { box, path } = bravuraGlyphs[id];
      expect(path.startsWith('M'), `${id} outline`).toBe(true);
      expect(box.w, `${id} width`).toBeGreaterThan(0);
      expect(box.h, `${id} height`).toBeGreaterThan(0);
    }
  });

  it('centres noteheads on their origin so a step maps straight to a y', () => {
    // A head's origin is its left edge at the vertical centre: the box straddles
    // y = 0. Positioning code relies on this, so pin it.
    for (const id of ids.filter((name) => name.startsWith('noteShape'))) {
      const { box } = bravuraGlyphs[id];
      expect(box.y, `${id} bottom`).toBeLessThan(0);
      expect(box.y + box.h, `${id} top`).toBeGreaterThan(0);
      expect(Math.abs(box.y + box.h / 2), `${id} centre`).toBeLessThan(0.02);
    }
  });
});
