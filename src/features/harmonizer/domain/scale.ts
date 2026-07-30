/**
 * Diatonic scale arithmetic for the supported tonal contexts: major, and
 * natural minor with la-based movable-do — for ALL twelve tonics (the letter
 * arithmetic in diatonicPitch generalizes; only the mode tables gate support).
 * Pure construction — interval tables plus letter/accidental arithmetic from
 * domain/pitch.ts. Unsupported contexts return null; callers treat that as
 * "tool disabled".
 */

import type {
  Accidental,
  DiatonicDegree,
  MelodyFragment,
  ScaleDegreePitch,
  SolfegeSyllable,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from './music-types';
import {
  ACCIDENTAL_OFFSETS,
  LETTERS,
  LETTER_SEMITONES,
  OFFSET_TO_ACCIDENTAL,
  spellPitch,
} from './pitch';

export { spellPitch };

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

/**
 * The spelled pitch class of a degree with a chromatic offset — a raised or
 * lowered degree keeps its letter and inflects the accidental (si in A minor
 * is G#, never Ab). Null when the spelling would need a triple accidental.
 */
export function spellDegree(
  context: TonalContext,
  degree: DiatonicDegree,
  chromaticOffset: number,
): SpelledPitchClass | null {
  const base = diatonicPitch(context, degree, 4);
  if (!base) return null;
  if (chromaticOffset === 0) {
    return { letter: base.letter, accidental: base.accidental, pitchClass: base.pitchClass };
  }
  const shifted = ACCIDENTAL_OFFSETS[base.accidental] + chromaticOffset;
  const accidental = OFFSET_TO_ACCIDENTAL[shifted] as Accidental | undefined;
  if (accidental === undefined) return null;
  return {
    letter: base.letter,
    accidental,
    pitchClass: (((base.pitchClass + chromaticOffset) % 12) + 12) % 12,
  };
}

export interface DegreeMember {
  degree: DiatonicDegree;
  chromaticOffset: number;
}

/** The conventionally raised leading tone in la-based minor (si). Null elsewhere. */
export function raisedSeventh(
  context: TonalContext,
): { member: DegreeMember; spelled: SpelledPitchClass } | null {
  if (context.mode !== 'natural_minor') return null;
  const spelled = spellDegree(context, 7, 1);
  if (!spelled) return null;
  return { member: { degree: 7, chromaticOffset: 1 }, spelled };
}

/** The raised sixth in la-based minor (fi — the dorian inflection). Null elsewhere. */
export function raisedSixth(
  context: TonalContext,
): { member: DegreeMember; spelled: SpelledPitchClass } | null {
  if (context.mode !== 'natural_minor') return null;
  const spelled = spellDegree(context, 6, 1);
  if (!spelled) return null;
  return { member: { degree: 6, chromaticOffset: 1 }, spelled };
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

/**
 * Best-effort scale degree for a bare pitch class: diatonic first, then the
 * preferred chromatic side, then the other. `prefer` defaults to 'raised' so
 * existing call sites keep their behavior; key-relative readings of flat-side
 * roots (bVII, bVI) pass 'lowered'.
 */
export function scaleDegreeForPitchClass(
  context: TonalContext,
  pitchClass: number,
  prefer: 'raised' | 'lowered' = 'raised',
): ScaleDegreePitch | null {
  const table = modeTable(context);
  if (!table) return null;
  const offsets = prefer === 'raised' ? [0, 1, -1] : [0, -1, 1];
  for (const chromaticOffset of offsets) {
    for (let d = 1; d <= 7; d += 1) {
      const degree = d as DiatonicDegree;
      const pc =
        (((context.tonicPitchClass + table.intervals[degree - 1] + chromaticOffset) % 12) + 12) %
        12;
      if (pc === pitchClass) {
        const syllable = syllableForDegree(context, degree, chromaticOffset);
        if (!syllable) continue; // syllable gap (mi#/ti#) — try the other reading
        return { degree, chromaticOffset, syllable };
      }
    }
  }
  return null;
}

/**
 * Re-read a pitch's scale degree in a context — the key-change primitive.
 * TOTAL for every supported context: the pitch NEVER moves; only the reading
 * changes. Spelling decides the degree (letter distance from the tonic letter,
 * accidental delta as the chromatic offset), so F# in C major reads fi and Gb
 * reads se. Falls back to an enharmonic pitch-class reading when the spelled
 * offset exceeds ±1 or hits a syllable gap (mi#/ti#), and to the bare letter
 * degree as a last resort. Null ONLY for unsupported modes.
 */
export function respellDegree(
  context: TonalContext,
  pitch: SpelledPitch | SpelledPitchClass,
): ScaleDegreePitch | null {
  const table = modeTable(context);
  if (!table) return null;
  const tonicIndex = LETTERS.indexOf(context.tonic.letter);
  const letterIndex = LETTERS.indexOf(pitch.letter);
  const degree = (((letterIndex - tonicIndex + 7) % 7) + 1) as DiatonicDegree;

  const diatonic = diatonicPitch(context, degree, 4);
  if (diatonic) {
    const offset = ACCIDENTAL_OFFSETS[pitch.accidental] - ACCIDENTAL_OFFSETS[diatonic.accidental];
    if (offset >= -1 && offset <= 1) {
      const syllable = syllableForDegree(context, degree, offset);
      if (syllable) return { degree, chromaticOffset: offset, syllable };
    }
    // Spelled reading unavailable (double-inflection or syllable gap) — try
    // the enharmonic reading on the side the spelling leans toward.
    const enharmonic = scaleDegreeForPitchClass(
      context,
      pitch.pitchClass,
      offset < 0 ? 'lowered' : 'raised',
    );
    if (enharmonic) return enharmonic;
  }
  // Last resort: the letter degree read diatonically. Reachable only for
  // pathological spellings; totality matters more than the lost inflection.
  return { degree, chromaticOffset: 0, syllable: table.syllables[degree - 1] };
}

/**
 * Step a note to the adjacent diatonic degree. Chromatic sources follow the
 * inflection: stepping AGAINST the inflection lands on the same degree natural
 * (si ↓ → sol♮, se ↑ → sol♮); stepping WITH it lands on the adjacent diatonic
 * degree (si ↑ → la). Returns null when the context is unsupported or the
 * result leaves the MIDI range.
 */
export function stepDiatonic(
  context: TonalContext,
  from: { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch },
  direction: 1 | -1,
): { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch } | null {
  const table = modeTable(context);
  if (!table) return null;

  const inflection = from.scaleDegree.chromaticOffset;
  const steppingAgainstInflection =
    (inflection > 0 && direction === -1) || (inflection < 0 && direction === 1);
  let nextDegree: DiatonicDegree;
  if (steppingAgainstInflection) {
    nextDegree = from.scaleDegree.degree; // the inflection steps off itself
  } else {
    let degree = (from.scaleDegree.degree + direction) as number;
    if (degree > 7) degree = 1;
    if (degree < 1) degree = 7;
    nextDegree = degree as DiatonicDegree;
  }

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
