/**
 * Authoring helpers for hand-written fixture data.
 *
 * These are arithmetic conveniences only — spelling → midi/pitch class,
 * shorthand constructors for times and durations. They make it impossible for
 * authored data to disagree with itself; they make no musical judgments.
 * The arithmetic itself lives in domain/pitch.ts (the canonical tables);
 * this module re-exports it plus the fixture-authoring shorthands.
 */

import type {
  DiatonicDegree,
  MusicalTime,
  RationalDuration,
  ScaleDegreePitch,
  SolfegeSyllable,
} from '../domain/music-types';

export {
  ACCIDENTAL_OFFSETS,
  LETTER_SEMITONES,
  computeMidi,
  computePitchClass,
  parsePitch as pitch,
  parsePitchClass as pc,
} from '../domain/pitch';

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
