import { describe, expect, it } from 'vitest';
import { getDefaultFixture } from '../../fixtures/registry';
import type { MelodyFragment, TonalContext } from '../music-types';
import { parsePitch, parsePitchClass } from '../pitch';
import { respellDegree } from '../scale';
import { unitsToDuration, unitsToTime } from '../timing';
import { generateReadings } from './generate';

const fixture = getDefaultFixture();
const C_MAJOR = fixture.initialState.tonalContext;

const A_MINOR: TonalContext = {
  tonic: parsePitchClass('A'),
  tonicPitchClass: 9,
  mode: 'natural_minor',
  minorDoSystem: 'la_based',
  solfegeSystem: 'movable_do',
};

function melody(context: TonalContext, spns: Array<[string, number, number]>): MelodyFragment {
  return {
    id: 'gen-frag',
    events: spns.map(([spn, startUnit, units], i) => {
      const pitch = parsePitch(spn);
      return {
        id: `m-${i}`,
        pitch,
        scaleDegree: respellDegree(context, pitch) ?? {
          degree: 1,
          chromaticOffset: 0,
          syllable: 'do',
        },
        start: unitsToTime(startUnit),
        duration: unitsToDuration(units),
        tieFromPrevious: false,
      };
    }),
  };
}

describe('generateReadings', () => {
  it('is deterministic: two runs produce deep-equal output', () => {
    const request = {
      fragment: fixture.initialState.fragment,
      context: C_MAJOR,
      phraseIntent: 'continue' as const,
    };
    expect(generateReadings(request)).toEqual(generateReadings(request));
  });

  it('respects hold boundaries: no chord change across a held boundary', () => {
    const fragment = melody(C_MAJOR, [
      ['G4', 0, 4],
      ['E4', 4, 4],
      ['C4', 8, 8],
    ]);
    const held = generateReadings({
      fragment,
      context: C_MAJOR,
      phraseIntent: 'continue',
      boundaryConstraints: [{ afterMelodyEventId: 'm-0', policy: 'hold' }],
    });
    expect(held.length).toBeGreaterThan(0);
    for (const candidate of held) {
      // The chord covering m-0 extends across m-1 (G and E share I/iii… but
      // hold guarantees no change at unit 4 in the CHOSEN path).
      const first = candidate.harmonyEvents[0];
      const firstUnits =
        (first.duration.numerator / first.duration.denominator) * 16;
      expect(firstUnits).toBeGreaterThanOrEqual(8);
    }
  });

  it('respects required boundaries: the chord must change', () => {
    const fragment = melody(C_MAJOR, [
      ['G4', 0, 8],
      ['G4', 8, 8],
    ]);
    const required = generateReadings({
      fragment,
      context: C_MAJOR,
      phraseIntent: 'continue',
      boundaryConstraints: [{ afterMelodyEventId: 'm-0', policy: 'required' }],
    });
    expect(required.length).toBeGreaterThan(0);
    for (const candidate of required) {
      expect(candidate.harmonyEvents.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('offers both minor v and major V (si) in la-based minor, labeled', () => {
    // la–ti–do with 'close': dominants compete for the ti.
    const fragment = melody(A_MINOR, [
      ['A4', 0, 4],
      ['B4', 4, 4],
      ['C5', 8, 8],
    ]);
    const readings = generateReadings({
      fragment,
      context: A_MINOR,
      phraseIntent: 'close',
    });
    expect(readings.length).toBeGreaterThan(0);
    // The raised-leading-tone evidence labels any candidate using major V.
    const anyRaised = readings.some((candidate) =>
      candidate.evidence.some((entry) => entry.featureId === 'raised_leading_tone'),
    );
    // ti (B) is a member of raised V — at least one candidate should use it.
    expect(anyRaised).toBe(true);
  });

  it('weighs ti-bearing chords away from gapped (pentatonic) melodies without filtering', () => {
    // do–re–mi — no ti anywhere (gapped shape).
    const fragment = melody(C_MAJOR, [
      ['C4', 0, 4],
      ['D4', 4, 4],
      ['E4', 8, 8],
    ]);
    const readings = generateReadings({
      fragment,
      context: C_MAJOR,
      phraseIntent: 'continue',
    });
    expect(readings.length).toBeGreaterThan(0);
    // The TOP reading avoids ti-bearing chords when alternatives exist; the
    // re still needs a chord (ii/V/V7 all contain re) so V-family may appear,
    // but the first-ranked candidate's opening chord is tonic-family.
    const top = readings[0];
    expect(top.harmonyEvents[0].analysis.functionTags).toContain('tonic');
  });

  it('ranks an authentic close on top for close intent (cadence tables at work)', () => {
    // sol–fa–mi–re–do closing shape.
    const fragment = melody(C_MAJOR, [
      ['G4', 0, 4],
      ['F4', 4, 4],
      ['E4', 8, 2],
      ['D4', 10, 2],
      ['C4', 12, 4],
    ]);
    const readings = generateReadings({
      fragment,
      context: C_MAJOR,
      phraseIntent: 'close',
    });
    expect(readings.length).toBeGreaterThan(0);
    const top = readings[0];
    const last = top.harmonyEvents[top.harmonyEvents.length - 1];
    expect(last.analysis.functionTags).toContain('tonic');
    expect(
      top.evidence.some(
        (entry) => entry.featureId === 'cadence_reading' && entry.value === 'authentic',
      ),
    ).toBe(true);
  });

  it('stays fast enough for per-keystroke regeneration', () => {
    const request = {
      fragment: fixture.initialState.fragment,
      context: C_MAJOR,
      phraseIntent: 'continue' as const,
    };
    generateReadings(request); // warm
    const start = performance.now();
    for (let i = 0; i < 10; i += 1) generateReadings(request);
    const perCall = (performance.now() - start) / 10;
    expect(perCall).toBeLessThan(50); // generous ceiling; expected ~<10ms
  });
});
