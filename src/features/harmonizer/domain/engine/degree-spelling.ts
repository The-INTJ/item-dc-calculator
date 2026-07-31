/**
 * Degree and numeral spelling — the SPELLING-faithful half of the key-relative
 * reading. The root's letter decides the degree, so Bb in C major reads bVII
 * (te) and A# reads #VI (li); pitch class alone cannot tell them apart. Also
 * owns numeral casing/prefix rendering and the basic harmonic-function tags
 * by degree + mode. Key analysis of whole sonorities lives in roman.ts.
 */

import type {
  DiatonicDegree,
  HarmonicFunctionTag,
  ScaleDegreePitch,
  SpelledPitchClass,
  TonalContext,
} from '../music-types';
import { ACCIDENTAL_OFFSETS, LETTERS } from '../pitch';
import { diatonicPitch, syllableForDegree } from '../scale';

const DEGREE_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

export interface SpelledDegree {
  degree: DiatonicDegree;
  chromaticOffset: number;
}

/**
 * The degree a spelled root sits on, from letter distance + accidental delta.
 * Null when the offset exceeds ±1 (no conventional numeral prefix).
 */
export function degreeForSpelledRoot(
  context: TonalContext,
  root: SpelledPitchClass,
): SpelledDegree | null {
  const tonicIndex = LETTERS.indexOf(context.tonic.letter);
  const rootIndex = LETTERS.indexOf(root.letter);
  const degree = ((((rootIndex - tonicIndex) % 7) + 7) % 7) + 1;
  const diatonic = diatonicPitch(context, degree as DiatonicDegree, 4);
  if (!diatonic) return null;
  const offset =
    ACCIDENTAL_OFFSETS[root.accidental] - ACCIDENTAL_OFFSETS[diatonic.accidental];
  if (offset < -1 || offset > 1) return null;
  return { degree: degree as DiatonicDegree, chromaticOffset: offset };
}

/** ScaleDegreePitch for a spelled root; base syllable stands in at syllable gaps. */
export function scaleDegreeForSpelledRoot(
  context: TonalContext,
  root: SpelledPitchClass,
): ScaleDegreePitch | null {
  const spelled = degreeForSpelledRoot(context, root);
  if (!spelled) return null;
  const syllable =
    syllableForDegree(context, spelled.degree, spelled.chromaticOffset) ??
    syllableForDegree(context, spelled.degree, 0);
  if (!syllable) return null;
  return { degree: spelled.degree, chromaticOffset: spelled.chromaticOffset, syllable };
}

export function numeralPrefix(chromaticOffset: number): string {
  if (chromaticOffset === 1) return '#';
  if (chromaticOffset === -1) return 'b';
  return '';
}

export function casedNumeral(degree: DiatonicDegree, lowercase: boolean): string {
  const base = DEGREE_NUMERALS[degree - 1];
  return lowercase ? base.toLowerCase() : base;
}

/** Basic function tags by degree + mode; sequence-aware tags come from annotate. */
export function functionTagsFor(
  context: TonalContext,
  spelled: SpelledDegree,
  quality: 'diminished' | 'other-quality' | null,
): HarmonicFunctionTag[] {
  if (spelled.chromaticOffset !== 0) {
    // Raised 7 in la-based minor is the conventional leading tone — dominant.
    if (context.mode === 'natural_minor' && spelled.degree === 7 && spelled.chromaticOffset === 1) {
      return ['dominant'];
    }
    return ['ambiguous'];
  }
  switch (spelled.degree) {
    case 1:
      return ['tonic'];
    case 2:
      return ['predominant'];
    case 3:
      return ['tonic_prolongation'];
    case 4:
      return ['predominant'];
    case 5:
      return ['dominant'];
    case 6:
      return ['tonic'];
    case 7:
      // Major's vii° leans dominant; natural minor's subtonic VII does not.
      return context.mode === 'major' || quality === 'diminished'
        ? ['dominant']
        : ['ambiguous'];
    default:
      return [];
  }
}
