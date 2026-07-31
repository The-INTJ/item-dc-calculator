/**
 * Spelling scale degrees as pitches: interval tables plus letter/accidental
 * arithmetic from domain/pitch.ts, and the conventional minor-mode
 * inflections (raised sixth and seventh) built on top.
 */

import type {
  Accidental,
  DiatonicDegree,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from '../music-types';
import {
  ACCIDENTAL_OFFSETS,
  LETTERS,
  LETTER_SEMITONES,
  OFFSET_TO_ACCIDENTAL,
} from '../pitch';
import { modeTable } from './mode-tables';

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
