/**
 * The key-relative reading of a named sonority: roman numerals with inversion
 * figures, b/# prefixes for chromatic roots, figured bass, slash display
 * symbols, and basic harmonic-function tags. Degree derivation is
 * SPELLING-faithful — the root's letter decides the degree, so Bb in C major
 * reads bVII (te) and A# reads #VI (li); pitch class alone cannot tell them
 * apart (the spelling half lives in degree-spelling.ts). Sequence-aware
 * refinements (cadential 6/4, passing chords) belong to the annotator, not
 * here.
 */

import type {
  HarmonicAnalysis,
  ScaleDegreePitch,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from '../music-types';
import { toPcName } from '../pitch';
import { SONORITY_TEMPLATES, type SonorityReading, type SonorityTemplate } from './chord-id';
import {
  casedNumeral,
  degreeForSpelledRoot,
  functionTagsFor,
  numeralPrefix,
  scaleDegreeForSpelledRoot,
} from './degree-spelling';

export {
  degreeForSpelledRoot,
  scaleDegreeForSpelledRoot,
  type SpelledDegree,
} from './degree-spelling';

/** Figured-bass shorthand by inversion; triads then sevenths. A triad's
 * inversion never reaches 3 — the fourth slot exists only to satisfy the
 * 0|1|2|3 index type. */
const TRIAD_FIGURES = ['', '6', '6/4', ''] as const;
const SEVENTH_FIGURES = ['7', '6/5', '4/3', '4/2'] as const;

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
 * Re-read a STORED harmony event in a (new) key: the chord structure, bass,
 * and inversion stay verbatim — only the key-relative analysis (numeral,
 * degree reading, function tags) is recomputed. Used when the tonal context
 * changes under an accepted-context seam. Chords whose quality has no
 * template (quality 'other') keep an honest '?' numeral.
 */
export function reanalyzeStoredHarmony(
  context: TonalContext,
  harmony: {
    chord: { root: SpelledPitchClass; quality: string };
    bassPitch: SpelledPitch;
    inversion: 0 | 1 | 2 | 3;
  },
): Pick<HarmonicAnalysis, 'romanNumeral' | 'scaleDegreeRoot' | 'functionTags'> {
  const spelled = degreeForSpelledRoot(context, harmony.chord.root);
  const scaleDegreeRoot = fallbackScaleDegree(context, harmony.chord.root);
  const template = SONORITY_TEMPLATES.find((entry) => entry.quality === harmony.chord.quality);
  if (!spelled || !template) {
    return { romanNumeral: '?', scaleDegreeRoot, functionTags: spelled ? [] : ['ambiguous'] };
  }
  const isSeventh = template.intervals.length === 4;
  const figure = isSeventh
    ? SEVENTH_FIGURES[harmony.inversion]
    : TRIAD_FIGURES[harmony.inversion];
  const qualityMarker = isSeventh
    ? template.numeralSuffix.replace(/7$/, '')
    : template.numeralSuffix;
  return {
    romanNumeral:
      numeralPrefix(spelled.chromaticOffset) +
      casedNumeral(spelled.degree, template.lowercaseNumeral) +
      qualityMarker +
      figure,
    scaleDegreeRoot,
    functionTags: functionTagsFor(
      context,
      spelled,
      template.quality === 'diminished' ? 'diminished' : 'other-quality',
    ),
  };
}

/** The exact/subset arm of analyzeInKey — a templated sonority read in a key. */
function templatedKeyReading(
  context: TonalContext,
  reading: Extract<SonorityReading, { kind: 'exact' | 'subset' }>,
  bassPitch: SpelledPitch,
): KeyReading {
  const bassName = toPcName({
    letter: bassPitch.letter,
    accidental: bassPitch.accidental,
    pitchClass: bassPitch.pitchClass,
  });
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
  if (reading.kind === 'exact' || reading.kind === 'subset') {
    return templatedKeyReading(context, reading, bassPitch);
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
