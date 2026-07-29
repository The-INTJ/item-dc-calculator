import { describe, expect, it } from 'vitest';
import type { MelodyEvent, MusicalTime, RationalDuration } from './music-types';
import {
  durationToUnits,
  formatBeatRange,
  timeToUnits,
  toTimelineSpan,
  totalUnits,
  unitsToSeconds,
} from './timing';

const QUARTER: RationalDuration = { numerator: 1, denominator: 4 };
const HALF: RationalDuration = { numerator: 1, denominator: 2 };
const WHOLE: RationalDuration = { numerator: 1, denominator: 1 };

function at(measure: number, beat: number, subdivision = 0): MusicalTime {
  return { measure, beat, subdivision };
}

function makeEvent(id: string, start: MusicalTime, duration: RationalDuration): MelodyEvent {
  return {
    id,
    pitch: { letter: 'G', accidental: 'natural', octave: 4, midi: 67, pitchClass: 7 },
    scaleDegree: { degree: 5, chromaticOffset: 0, syllable: 'sol' },
    start,
    duration,
    tieFromPrevious: false,
  };
}

describe('timing', () => {
  it('converts durations to sixteenth units', () => {
    expect(durationToUnits(QUARTER)).toBe(4);
    expect(durationToUnits(HALF)).toBe(8);
    expect(durationToUnits(WHOLE)).toBe(16);
    expect(durationToUnits({ numerator: 1, denominator: 8 })).toBe(2);
  });

  it('converts musical time to 0-based absolute units', () => {
    expect(timeToUnits(at(1, 1))).toBe(0);
    expect(timeToUnits(at(1, 2))).toBe(4);
    expect(timeToUnits(at(1, 3))).toBe(8);
    expect(timeToUnits(at(1, 2, 2))).toBe(6);
    expect(timeToUnits(at(2, 1))).toBe(16);
    expect(timeToUnits(at(0, 1))).toBe(-16);
  });

  it('computes 1-based timeline spans for the sol–fa–mi rhythm', () => {
    expect(toTimelineSpan(at(1, 1), QUARTER)).toEqual({ startUnit: 1, spanUnits: 4 });
    expect(toTimelineSpan(at(1, 2), QUARTER)).toEqual({ startUnit: 5, spanUnits: 4 });
    expect(toTimelineSpan(at(1, 3), HALF)).toEqual({ startUnit: 9, spanUnits: 8 });
  });

  it('totals fragment units from the furthest event end', () => {
    const fragment = {
      id: 'frag',
      events: [
        makeEvent('a', at(1, 1), QUARTER),
        makeEvent('b', at(1, 2), QUARTER),
        makeEvent('c', at(1, 3), HALF),
      ],
    };
    expect(totalUnits(fragment)).toBe(16);
    expect(totalUnits({ id: 'empty', events: [] })).toBe(0);
  });

  it('formats beat ranges', () => {
    expect(formatBeatRange(at(1, 1), QUARTER)).toBe('beat 1');
    expect(formatBeatRange(at(1, 2), QUARTER)).toBe('beat 2');
    expect(formatBeatRange(at(1, 3), HALF)).toBe('beats 3–4');
    expect(formatBeatRange(at(1, 1), WHOLE)).toBe('beats 1–4');
  });

  it('converts units to seconds via tempo', () => {
    // At 60 bpm a beat (4 units) is one second.
    expect(unitsToSeconds(4, 60)).toBe(1);
    expect(unitsToSeconds(16, 60)).toBe(4);
    // At 120 bpm the same beat is half a second.
    expect(unitsToSeconds(4, 120)).toBe(0.5);
  });
});
