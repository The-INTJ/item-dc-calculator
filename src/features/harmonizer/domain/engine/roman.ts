/**
 * The key-relative reading of a named sonority: roman numerals with inversion
 * figures, b/# prefixes for chromatic roots, figured bass, slash display
 * symbols, and basic harmonic-function tags. Degree derivation is
 * SPELLING-faithful — the root's letter decides the degree, so Bb in C major
 * reads bVII (te) and A# reads #VI (li); pitch class alone cannot tell them
 * apart. Sequence-aware refinements (cadential 6/4, passing chords) belong to
 * the annotator, not here.
 */

import type {
  DiatonicDegree,
  HarmonicAnalysis,
  HarmonicFunctionTag,
  ScaleDegreePitch,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from '../music-types';
import { ACCIDENTAL_OFFSETS, LETTERS, accidentalText, toPcName } from '../pitch';
import { diatonicPitch, syllableForDegree } from '../scale';
import type { SonorityReading, SonorityTemplate } from './chord-id';

const DEGREE_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

/** Figured-bass shorthand by inversion; triads then sevenths. A triad's
 * inversion never reaches 3 — the fourth slot exists only to satisfy the
 * 0|1|2|3 index type. */
const TRIAD_FIGURES = ['', '6', '6/4', ''] as const;
const SEVENTH_FIGURES = ['7', '6/5', '4/3', '4/2'] as const;

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

function numeralPrefix(chromaticOffset: number): string {
  if (chromaticOffset === 1) return '#';
  if (chromaticOffset === -1) return 'b';
  return '';
}

function casedNumeral(degree: DiatonicDegree, lowercase: boolean): string {
  const base = DEGREE_NUMERALS[degree - 1];
  return lowercase ? base.toLowerCase() : base;
}

/** Basic function tags by degree + mode; sequence-aware tags come from annotate. */
function functionTagsFor(
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

export interface KeyReading {
  analysis: HarmonicAnalysis;
  inversion: 0 | 1 | 2 | 3;
  displaySymbol: string;
  figuredBass?: string;
}

const FALLBACK_DEGREE: ScaleDegreePitch = { degree: 1, chromaticOffset: 0, syllable: 'do' };

function fallbackScaleDegree(context: TonalContext, pc: SpelledPitchClass): ScaleDegreePitch {
  return scaleDegreeForSpelledRoot(context, pc) ?? FALLBACK_DEGREE;
}

function joinedLetters(tones: SpelledPitchClass[]): string {
  const labels = tones.map(toPcName);
  return labels.filter((label, i) => labels.indexOf(label) === i).join('+');
}

/**
 * Read an identified sonority in a key. Total — every reading kind gets an
 * honest numeral ('?' when nothing key-relative can be said) and a display
 * symbol built from what actually sounds.
 */
export function analyzeInKey(
  context: TonalContext,
  reading: SonorityReading,
  bassPitch: SpelledPitch,
): KeyReading {
  const bassName = toPcName({
    letter: bassPitch.letter,
    accidental: bassPitch.accidental,
    pitchClass: bassPitch.pitchClass,
  });

  if (reading.kind === 'exact' || reading.kind === 'subset') {
    const template: SonorityTemplate = reading.template;
    const isSeventh = template.intervals.length === 4;
    const bassRelative = (bassPitch.pitchClass - reading.root.pitchClass + 12) % 12;
    const memberIndex = template.intervals.indexOf(bassRelative);
    const inversion = (memberIndex > 0 ? Math.min(3, memberIndex) : 0) as 0 | 1 | 2 | 3;
    const figure = isSeventh ? SEVENTH_FIGURES[inversion] : TRIAD_FIGURES[inversion];
    // Slash the symbol whenever the sounding bass is not the root — including
    // a subset reading whose bass is a leftover (memberIndex === -1).
    const slash =
      bassPitch.pitchClass !== reading.root.pitchClass ? `/${bassName}` : '';

    const spelled = degreeForSpelledRoot(context, reading.root);
    let romanNumeral = '?';
    if (spelled) {
      // Sevenths keep their quality marker before the figure (viiø6/5); the
      // marker is the numeral suffix minus its trailing 7 ('', 'maj', 'ø', '°').
      const qualityMarker = isSeventh
        ? template.numeralSuffix.replace(/7$/, '')
        : template.numeralSuffix;
      romanNumeral =
        numeralPrefix(spelled.chromaticOffset) +
        casedNumeral(spelled.degree, template.lowercaseNumeral) +
        qualityMarker +
        figure;
    }
    return {
      analysis: {
        romanNumeral,
        scaleDegreeRoot: fallbackScaleDegree(context, reading.root),
        functionTags: spelled
          ? functionTagsFor(
              context,
              spelled,
              reading.quality === 'diminished' ? 'diminished' : 'other-quality',
            )
          : ['ambiguous'],
      },
      inversion,
      displaySymbol: `${toPcName(reading.root)}${template.suffix}${slash}`,
      figuredBass: figure || undefined,
    };
  }

  if (reading.kind === 'open_fifth') {
    const spelled = degreeForSpelledRoot(context, reading.root);
    const diatonicRoot = spelled !== null && spelled.chromaticOffset === 0;
    return {
      analysis: {
        romanNumeral: diatonicRoot ? casedNumeral(spelled.degree, false) : '?',
        scaleDegreeRoot: fallbackScaleDegree(context, reading.root),
        functionTags: diatonicRoot ? functionTagsFor(context, spelled, null) : ['ambiguous'],
      },
      inversion: 0,
      displaySymbol: `${toPcName(reading.root)}5`,
    };
  }

  if (reading.kind === 'incomplete_triad') {
    const spelled = degreeForSpelledRoot(context, reading.root);
    const romanNumeral = spelled
      ? numeralPrefix(spelled.chromaticOffset) +
        casedNumeral(spelled.degree, reading.quality === 'minor')
      : '?';
    return {
      analysis: {
        romanNumeral,
        scaleDegreeRoot: fallbackScaleDegree(context, reading.root),
        functionTags: spelled ? functionTagsFor(context, spelled, null) : ['ambiguous'],
      },
      inversion: 0,
      displaySymbol: `${toPcName(reading.root)}${reading.quality === 'minor' ? 'm' : ''}(no 5)`,
    };
  }

  if (reading.kind === 'monad') {
    return {
      analysis: {
        romanNumeral: '?',
        scaleDegreeRoot: fallbackScaleDegree(context, reading.tone),
        functionTags: [],
      },
      inversion: 0,
      displaySymbol: toPcName(reading.tone),
    };
  }

  // dyad | unknown — show exactly what sounds.
  const tones = reading.tones;
  const first = tones[0] ?? {
    letter: bassPitch.letter,
    accidental: bassPitch.accidental,
    pitchClass: bassPitch.pitchClass,
  };
  return {
    analysis: {
      romanNumeral: '?',
      scaleDegreeRoot: fallbackScaleDegree(context, first),
      functionTags: [],
    },
    inversion: 0,
    displaySymbol: joinedLetters(tones),
  };
}
