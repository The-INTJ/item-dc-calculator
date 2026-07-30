import { describe, expect, it } from 'vitest';
import { getDefaultFixture, listFixtures } from '../fixtures/registry';
import { listKeyContexts } from './keys';
import type { SpelledPitch, TonalContext } from './music-types';
import { parsePitch, parsePitchClass } from './pitch';
import { respellAccepted, respellFragment, respellVoicing } from './respell';
import { respellDegree } from './scale';

const C_MAJOR: TonalContext = {
  tonic: parsePitchClass('C'),
  tonicPitchClass: 0,
  mode: 'major',
  solfegeSystem: 'movable_do',
};

const G_MAJOR: TonalContext = {
  tonic: parsePitchClass('G'),
  tonicPitchClass: 7,
  mode: 'major',
  solfegeSystem: 'movable_do',
};

const F_MAJOR: TonalContext = {
  tonic: parsePitchClass('F'),
  tonicPitchClass: 5,
  mode: 'major',
  solfegeSystem: 'movable_do',
};

describe('respellDegree', () => {
  it('reads by spelling: F# in C major is fi, Gb is se', () => {
    expect(respellDegree(C_MAJOR, parsePitch('F#4'))).toEqual({
      degree: 4,
      chromaticOffset: 1,
      syllable: 'fi',
    });
    expect(respellDegree(C_MAJOR, parsePitch('Gb4'))).toEqual({
      degree: 5,
      chromaticOffset: -1,
      syllable: 'se',
    });
  });

  it('reads out-of-key notes honestly after a key change (G# in F major = ri)', () => {
    expect(respellDegree(F_MAJOR, parsePitch('G#4'))).toEqual({
      degree: 2,
      chromaticOffset: 1,
      syllable: 'ri',
    });
    // F natural in G major is the lowered seventh — te, not a forced diatonic.
    expect(respellDegree(G_MAJOR, parsePitch('F4'))).toEqual({
      degree: 7,
      chromaticOffset: -1,
      syllable: 'te',
    });
  });

  it('is total over every offered key for every fixture pitch (never throws, never null)', () => {
    const pitches: SpelledPitch[] = listFixtures().flatMap((fixture) =>
      fixture.candidateSets.flatMap((set) =>
        set.candidates.flatMap((candidate) => [
          ...candidate.voicing.soprano,
          ...candidate.voicing.alto,
          ...candidate.voicing.tenor,
          ...candidate.voicing.bass,
        ]),
      ),
    ).map((event) => event.pitch);
    expect(pitches.length).toBeGreaterThan(0);
    for (const context of listKeyContexts()) {
      for (const pitch of pitches) {
        const reading = respellDegree(context, pitch);
        expect(reading).not.toBeNull();
        expect(reading!.degree).toBeGreaterThanOrEqual(1);
        expect(reading!.degree).toBeLessThanOrEqual(7);
      }
    }
  });

  it('reproduces every fixture-authored scaleDegree in its own context', () => {
    for (const fixture of listFixtures()) {
      const context = fixture.initialState.tonalContext;
      for (const event of fixture.initialState.fragment.events) {
        expect(respellDegree(context, event.pitch), `${fixture.id} ${event.id}`).toEqual(
          event.scaleDegree,
        );
      }
    }
  });
});

describe('respell over workbench shapes', () => {
  const fixture = getDefaultFixture();

  it('never moves a pitch, in any of the 24×24 key transitions', () => {
    const fragment = fixture.initialState.fragment;
    for (const from of listKeyContexts()) {
      const once = respellFragment(from, fragment);
      // Pitches byte-identical to the source in every key.
      once.events.forEach((event, i) => {
        expect(event.pitch).toEqual(fragment.events[i].pitch);
      });
      for (const to of listKeyContexts()) {
        const twice = respellFragment(to, once);
        twice.events.forEach((event, i) => {
          expect(event.pitch).toEqual(fragment.events[i].pitch);
        });
        // Respelling depends only on (context, pitch): a detour through any
        // key and back reproduces the direct reading exactly.
        const direct = respellFragment(to, fragment);
        expect(twice.events.map((event) => event.scaleDegree)).toEqual(
          direct.events.map((event) => event.scaleDegree),
        );
      }
    }
  });

  it('respells all four voices of a voicing', () => {
    const candidate = fixture.candidateSets[0].candidates[0];
    const respelled = respellVoicing(G_MAJOR, candidate.voicing);
    for (const voice of ['soprano', 'alto', 'tenor', 'bass'] as const) {
      respelled[voice].forEach((event, i) => {
        expect(event.pitch).toEqual(candidate.voicing[voice][i].pitch);
        expect(event.scaleDegree).toEqual(respellDegree(G_MAJOR, event.pitch));
      });
    }
  });

  it('re-reads the accepted seam: the chord you arrive from is I in C, IV in G', () => {
    const candidate = fixture.candidateSets[0].candidates[0];
    const cMajorTonic = candidate.harmonyEvents[0];
    expect(cMajorTonic.analysis.romanNumeral).toContain('I');
    const accepted = { previousHarmony: cMajorTonic, previousVoicing: candidate.voicing };
    const respelled = respellAccepted(G_MAJOR, accepted);
    expect(respelled.previousHarmony?.analysis.romanNumeral).toBe('IV');
    // The chord itself is untouched.
    expect(respelled.previousHarmony?.chord).toEqual(cMajorTonic.chord);
    expect(respelled.previousHarmony?.bassPitch).toEqual(cMajorTonic.bassPitch);
    // Seam voicing degrees re-read, pitches identical.
    respelled.previousVoicing?.soprano.forEach((event, i) => {
      expect(event.pitch).toEqual(candidate.voicing.soprano[i].pitch);
    });
  });
});
