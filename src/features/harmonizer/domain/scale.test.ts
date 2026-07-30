import { describe, expect, it } from 'vitest';
import type { ScaleDegreePitch, SpelledPitch, TonalContext } from './music-types';
import {
  diatonicPitch,
  MAX_MIDI,
  raisedSeventh,
  raisedSixth,
  scaleDegreeForPitchClass,
  spellDegree,
  spellPitch,
  stepDiatonic,
  syllableForDegree,
  tonicWholeNoteFragment,
} from './scale';

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

describe('scale', () => {
  it('spells every C-major degree', () => {
    const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const midis = [60, 62, 64, 65, 67, 69, 71];
    for (let degree = 1; degree <= 7; degree += 1) {
      const pitch = diatonicPitch(C_MAJOR, degree as 1, 4);
      expect(pitch?.letter).toBe(letters[degree - 1]);
      expect(pitch?.accidental).toBe('natural');
      expect(pitch?.midi).toBe(midis[degree - 1]);
    }
  });

  it('spells la-based A-minor degrees with the tonic on la', () => {
    // Degree 1 of A minor is A (la); degree 3 is C (do).
    expect(diatonicPitch(A_MINOR, 1, 4)?.midi).toBe(69);
    expect(syllableForDegree(A_MINOR, 1, 0)).toBe('la');
    expect(syllableForDegree(A_MINOR, 3, 0)).toBe('do');
    expect(syllableForDegree(A_MINOR, 7, 0)).toBe('sol');
    // Raised leading tone: sol + 1 = si.
    expect(syllableForDegree(A_MINOR, 7, 1)).toBe('si');
    expect(syllableForDegree(C_MAJOR, 3, -1)).toBe('me');
  });

  it('steps diatonically with octave carry across the letter wrap', () => {
    const ti = note(spellPitch('B', 'natural', 4), {
      degree: 7,
      chromaticOffset: 0,
      syllable: 'ti',
    });
    const up = stepDiatonic(C_MAJOR, ti, 1);
    expect(up?.pitch.midi).toBe(72); // C5
    expect(up?.scaleDegree.syllable).toBe('do');

    const doNote = note(spellPitch('C', 'natural', 5), {
      degree: 1,
      chromaticOffset: 0,
      syllable: 'do',
    });
    const down = stepDiatonic(C_MAJOR, doNote, -1);
    expect(down?.pitch.midi).toBe(71); // B4
    expect(down?.scaleDegree.syllable).toBe('ti');
  });

  it('steps chromatic sources with the inflection: against it lands same-degree natural', () => {
    // si (raised 7 in A minor, G#4 = midi 68): stepping WITH the raise reaches
    // la (A4); stepping AGAINST it steps off the inflection onto sol natural
    // (G4), not down to fa — the raise un-raises before the line descends.
    const si = note(spellPitch('G', '#', 4), { degree: 7, chromaticOffset: 1, syllable: 'si' });
    const up = stepDiatonic(A_MINOR, si, 1);
    expect(up?.scaleDegree).toEqual({ degree: 1, chromaticOffset: 0, syllable: 'la' });
    expect(up?.pitch.midi).toBe(69);
    const down = stepDiatonic(A_MINOR, si, -1);
    expect(down?.scaleDegree).toEqual({ degree: 7, chromaticOffset: 0, syllable: 'sol' });
    expect(down?.pitch.midi).toBe(67);

    // Lowered sources mirror: me (Eb in C major) stepping up lands on mi natural.
    const me = note(spellPitch('E', 'b', 4), { degree: 3, chromaticOffset: -1, syllable: 'me' });
    const offLowered = stepDiatonic(C_MAJOR, me, 1);
    expect(offLowered?.scaleDegree).toEqual({ degree: 3, chromaticOffset: 0, syllable: 'mi' });
    expect(offLowered?.pitch.midi).toBe(64);
  });

  it('clamps at the MIDI range and rejects unsupported contexts', () => {
    const top = note(spellPitch('C', 'natural', 6), {
      degree: 1,
      chromaticOffset: 0,
      syllable: 'do',
    });
    expect(top.pitch.midi).toBe(MAX_MIDI);
    expect(stepDiatonic(C_MAJOR, top, 1)).toBeNull();
    expect(stepDiatonic(UNSUPPORTED, top, -1)).toBeNull();
    expect(diatonicPitch(UNSUPPORTED, 1, 4)).toBeNull();
  });

  it('reads lowered chromatics when preferred (Bb in C major = te)', () => {
    // pc 10 in C major is li (raised 6) on the sharp side, te (lowered 7) flat.
    expect(scaleDegreeForPitchClass(C_MAJOR, 10)).toEqual({
      degree: 6,
      chromaticOffset: 1,
      syllable: 'li',
    });
    expect(scaleDegreeForPitchClass(C_MAJOR, 10, 'lowered')).toEqual({
      degree: 7,
      chromaticOffset: -1,
      syllable: 'te',
    });
  });

  it('spells raised degrees keeping their letter (si in A minor is G#)', () => {
    expect(spellDegree(A_MINOR, 7, 1)).toEqual({ letter: 'G', accidental: '#', pitchClass: 8 });
    expect(raisedSeventh(A_MINOR)?.spelled.letter).toBe('G');
    expect(raisedSixth(A_MINOR)?.spelled).toEqual({ letter: 'F', accidental: '#', pitchClass: 6 });
    expect(raisedSeventh(C_MAJOR)).toBeNull();
  });

  it('builds the tonic whole-note blank fragment for both contexts', () => {
    const major = tonicWholeNoteFragment(C_MAJOR, 'frag', 'note');
    expect(major?.events[0].scaleDegree.syllable).toBe('do');
    expect(major?.events[0].pitch.midi).toBe(60);
    const minor = tonicWholeNoteFragment(A_MINOR, 'frag', 'note');
    expect(minor?.events[0].scaleDegree.syllable).toBe('la');
    expect(minor?.events[0].pitch.midi).toBe(69);
  });
});
