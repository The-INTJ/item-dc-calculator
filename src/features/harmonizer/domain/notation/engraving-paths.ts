/**
 * The outlines that are not noteheads: clefs, rests, flags, the augmentation
 * dot, and accidentals. Each is a lookup into the embedded Bravura data — this
 * module exists so no component ever names a glyph directly.
 */

import type { Accidental } from '../music-types';
import type { BravuraGlyphId } from './bravura-glyphs';
import type { NotatedBase, StaveId, StemDirection } from './staff-types';

/** Written note values longest to shortest, for walking the rest and flag sets. */
export const NOTATED_BASES: NotatedBase[] = ['w', 'h', 'q', 'e', 's'];

export const CLEF_GLYPHS: Record<StaveId, BravuraGlyphId> = {
  treble: 'gClef',
  bass: 'fClef',
};

export const REST_GLYPHS: Record<NotatedBase, BravuraGlyphId> = {
  w: 'restWhole',
  h: 'restHalf',
  q: 'restQuarter',
  e: 'rest8th',
  s: 'rest16th',
};

export const ACCIDENTAL_GLYPHS: Record<Accidental, BravuraGlyphId | null> = {
  bb: 'accidentalDoubleFlat',
  b: 'accidentalFlat',
  natural: 'accidentalNatural',
  '#': 'accidentalSharp',
  x: 'accidentalDoubleSharp',
};

const FLAG_GLYPHS: Record<'e' | 's', Record<StemDirection, BravuraGlyphId>> = {
  e: { up: 'flag8thUp', down: 'flag8thDown' },
  s: { up: 'flag16thUp', down: 'flag16thDown' },
};

/**
 * The flag for a value, or null for anything a quarter note or longer. Eighths
 * and sixteenths are flagged individually rather than beamed: in the seven-shape
 * books a beam groups a melisma, and one syllable per note is the norm here.
 */
export function flagGlyph(base: NotatedBase, stem: StemDirection): BravuraGlyphId | null {
  if (base !== 'e' && base !== 's') return null;
  return FLAG_GLYPHS[base][stem];
}

export const AUGMENTATION_DOT: BravuraGlyphId = 'augmentationDot';
