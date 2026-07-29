/**
 * Diatonic scale arithmetic for the supported tonal contexts: major, and
 * natural minor with la-based movable-do. Pure construction — interval tables
 * plus letter/accidental arithmetic, the same license as fixtures/authoring.ts.
 * Unsupported contexts return null; callers treat that as "tool disabled".
 */

import type {
  Accidental,
  DiatonicDegree,
  LetterName,
  MelodyFragment,
  ScaleDegreePitch,
  SolfegeSyllable,
  SpelledPitch,
  TonalContext,
} from './music-types';

const LETTERS: LetterName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_SEMITONES: Record<LetterName, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};
const OFFSET_TO_ACCIDENTAL: Record<number, Accidental> = {
  [-2]: 'bb',
  [-1]: 'b',
  0: 'natural',
  1: '#',
  2: 'x',
};

/** Hard range for pitch stepping — beyond it the arrows no-op. */
export const MIN_MIDI = 36; // C2
export const MAX_MIDI = 84; // C6

interface ModeTable {
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

function modeTable(context: TonalContext): ModeTable | null {
  if (context.mode === 'major') return MAJOR;
  if (context.mode === 'natural_minor' && context.minorDoSystem === 'la_based') {
    return NATURAL_MINOR_LA_BASED;
  }
  return null;
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

/** Spell a pitch from parts (arithmetic; octave is letter-based scientific notation). */
export function spellPitch(letter: LetterName, accidental: Accidental, octave: number): SpelledPitch {
  const offsets: Record<Accidental, number> = { bb: -2, b: -1, natural: 0, '#': 1, x: 2 };
  const midi = (octave + 1) * 12 + LETTER_SEMITONES[letter] + offsets[accidental];
  return { letter, accidental, octave, midi, pitchClass: ((midi % 12) + 12) % 12 };
}

/** The spelled pitch of a diatonic scale degree in a letter-based octave. */
export function diatonicPitch(
  context: TonalContext,
  degree: DiatonicDegree,
  octave: number,
): SpelledPitch | null {
  const table = modeTable(context);
  if (!table) return null;
  const tonicIndex = LETTERS.indexOf(context.tonic.letter);
  const letter = LETTERS[(tonicIndex + degree - 1) % 7];
  const targetPc = (context.tonicPitchClass + table.intervals[degree - 1]) % 12;
  const naturalPc = LETTER_SEMITONES[letter];
  let offset = targetPc - naturalPc;
  if (offset > 2) offset -= 12;
  if (offset < -2) offset += 12;
  const accidental = OFFSET_TO_ACCIDENTAL[offset] as Accidental | undefined;
  if (accidental === undefined) return null;
  const midi = (octave + 1) * 12 + naturalPc + offset;
  return { letter, accidental, octave, midi, pitchClass: ((midi % 12) + 12) % 12 };
}

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

/** Best-effort scale degree for a bare pitch class: diatonic, else raised by one. */
export function scaleDegreeForPitchClass(
  context: TonalContext,
  pitchClass: number,
): ScaleDegreePitch | null {
  const table = modeTable(context);
  if (!table) return null;
  for (const chromaticOffset of [0, 1] as const) {
    for (let d = 1; d <= 7; d += 1) {
      const degree = d as DiatonicDegree;
      const pc = (context.tonicPitchClass + table.intervals[degree - 1] + chromaticOffset) % 12;
      if (pc === pitchClass) {
        const syllable = syllableForDegree(context, degree, chromaticOffset);
        if (!syllable) return null;
        return { degree, chromaticOffset, syllable };
      }
    }
  }
  return null;
}

/**
 * Step a note to the adjacent diatonic degree (chromatic sources land on the
 * adjacent diatonic degree — POC rule). Returns null when the context is
 * unsupported or the result leaves the MIDI range.
 */
export function stepDiatonic(
  context: TonalContext,
  from: { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch },
  direction: 1 | -1,
): { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch } | null {
  const table = modeTable(context);
  if (!table) return null;
  let degree = (from.scaleDegree.degree + direction) as number;
  if (degree > 7) degree = 1;
  if (degree < 1) degree = 7;
  const nextDegree = degree as DiatonicDegree;

  // Try the same letter-octave first, then adjust one octave in the step's
  // direction until the midi moves the right way.
  let pitch = diatonicPitch(context, nextDegree, from.pitch.octave);
  if (!pitch) return null;
  if (direction === 1 && pitch.midi <= from.pitch.midi) {
    pitch = diatonicPitch(context, nextDegree, from.pitch.octave + 1);
  } else if (direction === -1 && pitch.midi >= from.pitch.midi) {
    pitch = diatonicPitch(context, nextDegree, from.pitch.octave - 1);
  }
  if (!pitch || pitch.midi < MIN_MIDI || pitch.midi > MAX_MIDI) return null;
  const syllable = table.syllables[nextDegree - 1];
  return {
    pitch,
    scaleDegree: { degree: nextDegree, chromaticOffset: 0, syllable },
  };
}

/** The Blank next-fragment: one tonic whole note (do / la) in octave 4. */
export function tonicWholeNoteFragment(
  context: TonalContext,
  fragmentId: string,
  eventId: string,
): MelodyFragment | null {
  const table = modeTable(context);
  const pitch = diatonicPitch(context, 1, 4);
  if (!table || !pitch) return null;
  return {
    id: fragmentId,
    events: [
      {
        id: eventId,
        pitch,
        scaleDegree: { degree: 1, chromaticOffset: 0, syllable: table.syllables[0] },
        start: { measure: 1, beat: 1, subdivision: 0 },
        duration: { numerator: 1, denominator: 1 },
        tieFromPrevious: false,
        metricStrength: 'strong',
      },
    ],
  };
}
