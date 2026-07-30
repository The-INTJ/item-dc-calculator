/**
 * Canonical pitch arithmetic — the single home of the letter/accidental tables
 * that were previously duplicated between fixtures/authoring.ts and
 * domain/scale.ts. Spelling is the source of truth: midi and pitchClass are
 * always computed FROM letter+accidental+octave, never the reverse. Scientific
 * octaves (C4 = midi 60). Dependency-free; `tonal` lives only behind
 * domain/engine/tonal-bridge.ts and is never imported here.
 */

import type {
  Accidental,
  LetterName,
  SpelledPitch,
  SpelledPitchClass,
} from './music-types';

export const LETTERS: LetterName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

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

export const OFFSET_TO_ACCIDENTAL: Record<number, Accidental> = {
  [-2]: 'bb',
  [-1]: 'b',
  0: 'natural',
  1: '#',
  2: 'x',
};

export function computeMidi(letter: LetterName, accidental: Accidental, octave: number): number {
  return (octave + 1) * 12 + LETTER_SEMITONES[letter] + ACCIDENTAL_OFFSETS[accidental];
}

export function computePitchClass(letter: LetterName, accidental: Accidental): number {
  const semitones = LETTER_SEMITONES[letter] + ACCIDENTAL_OFFSETS[accidental];
  return ((semitones % 12) + 12) % 12;
}

/** Spell a pitch from parts; midi/pitchClass computed, never trusted. */
export function spellPitch(letter: LetterName, accidental: Accidental, octave: number): SpelledPitch {
  const midi = computeMidi(letter, accidental, octave);
  return { letter, accidental, octave, midi, pitchClass: ((midi % 12) + 12) % 12 };
}

export function spellPitchClass(letter: LetterName, accidental: Accidental): SpelledPitchClass {
  return { letter, accidental, pitchClass: computePitchClass(letter, accidental) };
}

const PITCH_PATTERN = /^([A-G])(bb|b|#|x)?(-?\d+)$/;
const PITCH_CLASS_PATTERN = /^([A-G])(bb|b|#|x)?$/;

/** Parse notation like "G4", "F#3", "Bb2" into a fully computed SpelledPitch. */
export function parsePitch(notation: string): SpelledPitch {
  const match = PITCH_PATTERN.exec(notation);
  if (!match) throw new Error(`Unrecognized pitch notation: ${notation}`);
  return spellPitch(match[1] as LetterName, (match[2] ?? 'natural') as Accidental, Number(match[3]));
}

/** Parse notation like "C", "F#", "Bb" into a SpelledPitchClass. */
export function parsePitchClass(notation: string): SpelledPitchClass {
  const match = PITCH_CLASS_PATTERN.exec(notation);
  if (!match) throw new Error(`Unrecognized pitch-class notation: ${notation}`);
  return spellPitchClass(match[1] as LetterName, (match[2] ?? 'natural') as Accidental);
}

/** '' for natural, the accidental verbatim otherwise — display + notation text. */
export function accidentalText(accidental: Accidental): string {
  return accidental === 'natural' ? '' : accidental;
}

/** "C#4", "Bb2", "Cx5" — scientific pitch notation; 'x'/'bb' parse verbatim in tonal. */
export function toSpn(pitch: SpelledPitch): string {
  return `${pitch.letter}${accidentalText(pitch.accidental)}${pitch.octave}`;
}

/** "C#", "Bb" — pitch-class name without octave. */
export function toPcName(pitch: SpelledPitchClass): string {
  return `${pitch.letter}${accidentalText(pitch.accidental)}`;
}
