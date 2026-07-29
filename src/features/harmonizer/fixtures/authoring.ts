/**
 * Authoring helpers for hand-written fixture data.
 *
 * These are arithmetic conveniences only — spelling → midi/pitch class,
 * shorthand constructors for times and durations. They make it impossible for
 * authored data to disagree with itself; they make no musical judgments
 * (spec §29: no theory engine in Phase 0).
 */

import type {
  Accidental,
  DiatonicDegree,
  LetterName,
  MusicalTime,
  RationalDuration,
  ScaleDegreePitch,
  SolfegeSyllable,
  SpelledPitch,
  SpelledPitchClass,
} from '../domain/music-types';

export const LETTER_SEMITONES: Record<LetterName, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export const ACCIDENTAL_OFFSETS: Record<Accidental, number> = {
  bb: -2,
  b: -1,
  natural: 0,
  '#': 1,
  x: 2,
};

export function computeMidi(letter: LetterName, accidental: Accidental, octave: number): number {
  return (octave + 1) * 12 + LETTER_SEMITONES[letter] + ACCIDENTAL_OFFSETS[accidental];
}

export function computePitchClass(letter: LetterName, accidental: Accidental): number {
  const semitones = LETTER_SEMITONES[letter] + ACCIDENTAL_OFFSETS[accidental];
  return ((semitones % 12) + 12) % 12;
}

const PITCH_PATTERN = /^([A-G])(bb|b|#|x)?(-?\d+)$/;
const PITCH_CLASS_PATTERN = /^([A-G])(bb|b|#|x)?$/;

/** Parse notation like "G4", "F#3", "Bb2" into a fully computed SpelledPitch. */
export function pitch(notation: string): SpelledPitch {
  const match = PITCH_PATTERN.exec(notation);
  if (!match) throw new Error(`Unrecognized pitch notation: ${notation}`);
  const letter = match[1] as LetterName;
  const accidental = (match[2] ?? 'natural') as Accidental;
  const octave = Number(match[3]);
  const midi = computeMidi(letter, accidental, octave);
  return { letter, accidental, octave, midi, pitchClass: ((midi % 12) + 12) % 12 };
}

/** Parse notation like "C", "F#", "Bb" into a SpelledPitchClass. */
export function pc(notation: string): SpelledPitchClass {
  const match = PITCH_CLASS_PATTERN.exec(notation);
  if (!match) throw new Error(`Unrecognized pitch-class notation: ${notation}`);
  const letter = match[1] as LetterName;
  const accidental = (match[2] ?? 'natural') as Accidental;
  return { letter, accidental, pitchClass: computePitchClass(letter, accidental) };
}

export function deg(
  degree: DiatonicDegree,
  syllable: SolfegeSyllable,
  chromaticOffset = 0,
): ScaleDegreePitch {
  return { degree, chromaticOffset, syllable };
}

export function at(measure: number, beat: number, subdivision = 0): MusicalTime {
  return { measure, beat, subdivision };
}

export const Q: RationalDuration = { numerator: 1, denominator: 4 };
export const H: RationalDuration = { numerator: 1, denominator: 2 };
export const W: RationalDuration = { numerator: 1, denominator: 1 };
