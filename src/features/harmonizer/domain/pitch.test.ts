import { describe, expect, it } from 'vitest';
import type { Accidental, LetterName } from './music-types';
import {
  ACCIDENTAL_OFFSETS,
  LETTERS,
  accidentalText,
  computeMidi,
  computePitchClass,
  parsePitch,
  parsePitchClass,
  spellPitch,
  spellPitchClass,
  toPcName,
  toSpn,
} from './pitch';

const ACCIDENTALS: Accidental[] = ['bb', 'b', 'natural', '#', 'x'];

describe('pitch', () => {
  it('round-trips every letter × accidental × octave through SPN', () => {
    for (const letter of LETTERS) {
      for (const accidental of ACCIDENTALS) {
        for (const octave of [2, 3, 4, 5]) {
          const spelled = spellPitch(letter, accidental, octave);
          const back = parsePitch(toSpn(spelled));
          expect(back).toEqual(spelled);
        }
      }
    }
  });

  it('round-trips pitch classes through their names', () => {
    for (const letter of LETTERS) {
      for (const accidental of ACCIDENTALS) {
        const spelled = spellPitchClass(letter, accidental);
        expect(parsePitchClass(toPcName(spelled))).toEqual(spelled);
      }
    }
  });

  it('keeps midi and pitchClass consistent with the spelling', () => {
    for (const letter of LETTERS as LetterName[]) {
      for (const accidental of ACCIDENTALS) {
        const spelled = spellPitch(letter, accidental, 4);
        expect(spelled.midi).toBe(computeMidi(letter, accidental, 4));
        expect(spelled.pitchClass).toBe(computePitchClass(letter, accidental));
        expect(spelled.pitchClass).toBe(((spelled.midi % 12) + 12) % 12);
      }
    }
    // Scientific anchor: C4 = 60.
    expect(computeMidi('C', 'natural', 4)).toBe(60);
    expect(ACCIDENTAL_OFFSETS.x).toBe(2);
  });

  it('renders naturals with no accidental text', () => {
    expect(accidentalText('natural')).toBe('');
    expect(toSpn(spellPitch('B', 'b', 2))).toBe('Bb2');
    expect(toSpn(spellPitch('C', 'x', 5))).toBe('Cx5');
    expect(toPcName(spellPitchClass('F', '#'))).toBe('F#');
  });
});
