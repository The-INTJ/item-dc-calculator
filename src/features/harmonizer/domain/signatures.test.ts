import { describe, expect, it } from 'vitest';
import type { HarmonyEvent, MelodyEvent } from './music-types';
import { acceptedHarmonySignature, durationToCode, melodySignature } from './signatures';

function makeMelodyEvent(
  id: string,
  syllable: MelodyEvent['scaleDegree']['syllable'],
  octave: number,
  denominator: number,
  beat = 1,
): MelodyEvent {
  return {
    id,
    pitch: { letter: 'C', accidental: 'natural', octave, midi: 60, pitchClass: 0 },
    scaleDegree: { degree: 1, chromaticOffset: 0, syllable },
    start: { measure: 1, beat, subdivision: 0 },
    duration: { numerator: 1, denominator },
    tieFromPrevious: false,
  };
}

function makeHarmonyEvent(romanNumeral: string, inversion: 0 | 1 | 2 | 3): HarmonyEvent {
  return {
    id: 'h-1',
    start: { measure: 1, beat: 1, subdivision: 0 },
    duration: { numerator: 1, denominator: 1 },
    chord: {
      id: 'chord-c-major',
      root: { letter: 'C', accidental: 'natural', pitchClass: 0 },
      pitchClasses: [0, 4, 7],
      spelledChordTones: [
        { letter: 'C', accidental: 'natural', pitchClass: 0 },
        { letter: 'E', accidental: 'natural', pitchClass: 4 },
        { letter: 'G', accidental: 'natural', pitchClass: 7 },
      ],
      quality: 'major',
    },
    analysis: {
      romanNumeral,
      scaleDegreeRoot: { degree: 1, chromaticOffset: 0, syllable: 'do' },
      functionTags: ['tonic'],
    },
    inversion,
    bassPitch: { letter: 'C', accidental: 'natural', octave: 3, midi: 48, pitchClass: 0 },
    displaySymbol: 'C',
  };
}

describe('signatures', () => {
  it('encodes durations as letter codes with a rational fallback', () => {
    expect(durationToCode({ numerator: 1, denominator: 1 })).toBe('w');
    expect(durationToCode({ numerator: 1, denominator: 2 })).toBe('h');
    expect(durationToCode({ numerator: 1, denominator: 4 })).toBe('q');
    expect(durationToCode({ numerator: 1, denominator: 8 })).toBe('e');
    expect(durationToCode({ numerator: 1, denominator: 16 })).toBe('s');
    expect(durationToCode({ numerator: 3, denominator: 8 })).toBe('3/8');
  });

  it('builds the melody signature for sol–fa–mi (gapless output is the historical format)', () => {
    const events = [
      makeMelodyEvent('m1', 'sol', 4, 4, 1),
      makeMelodyEvent('m2', 'fa', 4, 4, 2),
      makeMelodyEvent('m3', 'mi', 4, 2, 3),
    ];
    expect(melodySignature(events)).toBe('sol4:q|fa4:q|mi4:h');
    expect(melodySignature([])).toBe('');
  });

  it('encodes rests for leading and internal gaps', () => {
    // Note on beat 2 only: a leading quarter rest.
    expect(melodySignature([makeMelodyEvent('m1', 'do', 4, 4, 2)])).toBe('r:q|do4:q');
    // Gap between beat 1 and beat 4 notes: an internal half rest.
    expect(
      melodySignature([
        makeMelodyEvent('m1', 'sol', 4, 4, 1),
        makeMelodyEvent('m2', 'mi', 4, 4, 4),
      ]),
    ).toBe('sol4:q|r:h|mi4:q');
  });

  it('builds the accepted-harmony signature', () => {
    expect(acceptedHarmonySignature(makeHarmonyEvent('I', 0))).toBe('I:root');
    expect(acceptedHarmonySignature(makeHarmonyEvent('I6', 1))).toBe('I6:first');
    expect(acceptedHarmonySignature(null)).toBe('none');
  });
});
