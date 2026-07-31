/**
 * The mode tables that gate context support — major, and natural minor with
 * la-based movable-do — plus the syllable inflection maps and the
 * degree-to-syllable lookup built on them.
 */

import type { DiatonicDegree, SolfegeSyllable, TonalContext } from '../music-types';

export interface ModeTable {
  intervals: number[];
  syllables: SolfegeSyllable[];
}

const MAJOR: ModeTable = {
  intervals: [0, 2, 4, 5, 7, 9, 11],
  syllables: ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'],
};

/** La-based minor: the tonic is la; syllables borrowed from the relative major. */
const NATURAL_MINOR_LA_BASED: ModeTable = {
  intervals: [0, 2, 3, 5, 7, 8, 10],
  syllables: ['la', 'ti', 'do', 're', 'mi', 'fa', 'sol'],
};

export function modeTable(context: TonalContext): ModeTable | null {
  if (context.mode === 'major') return MAJOR;
  if (context.mode === 'natural_minor' && context.minorDoSystem === 'la_based') {
    return NATURAL_MINOR_LA_BASED;
  }
  return null;
}

/**
 * Which syllable a mode counts from. Every mode reads as either do-based or
 * la-based, and nothing else: the third above the tonic decides it — a major
 * third counts from do, a minor third from la. Everything the mode does beyond
 * that third is spelled with accidentals rather than a new set of syllables,
 * which is what keeps the seven shapes to seven.
 *
 * Only major and la-based minor exist today, so this reads straight off the
 * table. When a mode is added (dorian is the likeliest — shape-note singers
 * raise the sixth in minor as a matter of course), give its table the syllables
 * of whichever base its third points to, and this keeps answering correctly.
 */
export type SolfegeBase = 'do_based' | 'la_based';

export function solfegeBase(context: TonalContext): SolfegeBase | null {
  const table = modeTable(context);
  if (!table) return null;
  return table.syllables[0] === 'la' ? 'la_based' : 'do_based';
}

const RAISED: Partial<Record<SolfegeSyllable, SolfegeSyllable>> = {
  do: 'di',
  re: 'ri',
  fa: 'fi',
  sol: 'si',
  la: 'li',
};
const LOWERED: Partial<Record<SolfegeSyllable, SolfegeSyllable>> = {
  re: 'ra',
  mi: 'me',
  sol: 'se',
  la: 'le',
  ti: 'te',
};

/** Syllable for a degree (+chromatic offset) in a context; null when unmapped. */
export function syllableForDegree(
  context: TonalContext,
  degree: DiatonicDegree,
  chromaticOffset: number,
): SolfegeSyllable | null {
  const table = modeTable(context);
  if (!table) return null;
  const base = table.syllables[degree - 1];
  if (chromaticOffset === 0) return base;
  if (chromaticOffset === 1) return RAISED[base] ?? null;
  if (chromaticOffset === -1) return LOWERED[base] ?? null;
  return null;
}
