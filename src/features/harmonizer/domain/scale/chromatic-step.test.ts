import { describe, expect, it } from 'vitest';
import type { ScaleDegreePitch, SpelledPitch, TonalContext } from '../music-types';
import { spellPitch } from '../pitch';
import { stepChromatic } from './chromatic-step';
import { MAX_MIDI, MIN_MIDI } from './diatonic-step';

const C_MAJOR: TonalContext = {
  tonic: { letter: 'C', accidental: 'natural', pitchClass: 0 },
  tonicPitchClass: 0,
  mode: 'major',
  solfegeSystem: 'movable_do',
};

const A_MINOR: TonalContext = {
  tonic: { letter: 'A', accidental: 'natural', pitchClass: 9 },
  tonicPitchClass: 9,
  mode: 'natural_minor',
  minorDoSystem: 'la_based',
  solfegeSystem: 'movable_do',
};

const UNSUPPORTED: TonalContext = { ...A_MINOR, minorDoSystem: 'do_based' };

function note(pitch: SpelledPitch, scaleDegree: ScaleDegreePitch) {
  return { pitch, scaleDegree };
}

/** Sol in C major: the note the staff's grid opens on in the default fixture. */
function sol() {
  return note(spellPitch('G', 'natural', 4), { degree: 5, chromaticOffset: 0, syllable: 'sol' });
}

describe('stepChromatic', () => {
  it('moves exactly one semitone', () => {
    expect(stepChromatic(C_MAJOR, sol(), 1)!.pitch.midi).toBe(68);
    expect(stepChromatic(C_MAJOR, sol(), -1)!.pitch.midi).toBe(66);
  });

  it('spells the note between two degrees as an INFLECTION of the one it left', () => {
    // Up from sol is a raised sol, not a flattened la — so the notehead keeps
    // sol's shape and prints a sharp. This is the rule the whole shape system
    // rests on: the degree is the truth, the syllable is not.
    const up = stepChromatic(C_MAJOR, sol(), 1)!;
    expect(up.pitch.letter).toBe('G');
    expect(up.pitch.accidental).toBe('#');
    expect(up.scaleDegree.degree).toBe(5);
    expect(up.scaleDegree.chromaticOffset).toBe(1);
  });

  it('sharpens going up and flattens coming down', () => {
    const mi = note(spellPitch('E', 'natural', 4), {
      degree: 3,
      chromaticOffset: 0,
      syllable: 'mi',
    });
    const re = note(spellPitch('D', 'natural', 4), {
      degree: 2,
      chromaticOffset: 0,
      syllable: 're',
    });
    // The same sounding pitch, written the way the line is going.
    expect(stepChromatic(C_MAJOR, mi, -1)!.pitch.accidental).toBe('b');
    expect(stepChromatic(C_MAJOR, mi, -1)!.pitch.letter).toBe('E');
    expect(stepChromatic(C_MAJOR, re, 1)!.pitch.accidental).toBe('#');
    expect(stepChromatic(C_MAJOR, re, 1)!.pitch.letter).toBe('D');
  });

  it('lands on a plain degree where one is a semitone away', () => {
    const mi = note(spellPitch('E', 'natural', 4), {
      degree: 3,
      chromaticOffset: 0,
      syllable: 'mi',
    });
    const fa = stepChromatic(C_MAJOR, mi, 1)!;
    expect(fa.pitch.letter).toBe('F');
    expect(fa.pitch.accidental).toBe('natural');
    expect(fa.scaleDegree).toMatchObject({ degree: 4, chromaticOffset: 0 });
  });

  it('steps an inflection back off itself', () => {
    // si is the raised seventh of la-based minor. Coming down from it lands on
    // sol natural — the same behaviour the diatonic arrows have, arrived at
    // here by reading the sounding pitch fresh rather than by special-casing.
    const si = note(spellPitch('G', '#', 4), { degree: 7, chromaticOffset: 1, syllable: 'si' });
    const down = stepChromatic(A_MINOR, si, -1)!;
    expect(down.pitch.letter).toBe('G');
    expect(down.pitch.accidental).toBe('natural');
    expect(down.scaleDegree).toMatchObject({ degree: 7, chromaticOffset: 0 });
  });

  it('carries the octave with the letter, not with the sound', () => {
    const ti = note(spellPitch('B', 'natural', 4), {
      degree: 7,
      chromaticOffset: 0,
      syllable: 'ti',
    });
    const up = stepChromatic(C_MAJOR, ti, 1)!;
    expect(up.pitch.midi).toBe(72);
    expect(up.pitch.octave).toBe(5);
    expect(up.pitch.letter).toBe('C');
  });

  it('stops at the edges of what a voice can sing', () => {
    const low = note(spellPitch('C', 'natural', 2), {
      degree: 1,
      chromaticOffset: 0,
      syllable: 'do',
    });
    const high = note(spellPitch('C', 'natural', 6), {
      degree: 1,
      chromaticOffset: 0,
      syllable: 'do',
    });
    expect(low.pitch.midi).toBe(MIN_MIDI);
    expect(high.pitch.midi).toBe(MAX_MIDI);
    expect(stepChromatic(C_MAJOR, low, -1)).toBeNull();
    expect(stepChromatic(C_MAJOR, high, 1)).toBeNull();
  });

  it('declines a context it has no table for', () => {
    expect(stepChromatic(UNSUPPORTED, sol(), 1)).toBeNull();
  });

  it('returns to where it started after stepping out and back', () => {
    // Twelve semitones up and twelve back down is the same note, whatever it
    // was spelled as along the way.
    let current = sol();
    for (let taken = 0; taken < 12; taken += 1) current = stepChromatic(C_MAJOR, current, 1)!;
    expect(current.pitch.midi).toBe(79);
    for (let taken = 0; taken < 12; taken += 1) current = stepChromatic(C_MAJOR, current, -1)!;
    expect(current.pitch.midi).toBe(67);
    expect(current.scaleDegree.degree).toBe(5);
  });
});
