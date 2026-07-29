import { describe, expect, it } from 'vitest';
import { getDefaultFixture } from '../fixtures/registry';
import type { TonalContext } from './music-types';
import { assembleSkeletons, enumerateChords } from './enumerate';

const fixture = getDefaultFixture();
const C_MAJOR = fixture.initialState.tonalContext;
const fragment = fixture.initialState.fragment;

const A_MINOR: TonalContext = {
  tonic: { letter: 'A', accidental: 'natural', pitchClass: 9 },
  tonicPitchClass: 9,
  mode: 'natural_minor',
  minorDoSystem: 'la_based',
  solfegeSystem: 'movable_do',
};

describe('enumerateChords', () => {
  it('builds the mechanical C-major vocabulary with correct qualities', () => {
    const chords = enumerateChords(C_MAJOR);
    expect(chords).not.toBeNull();
    const byKey = new Map((chords ?? []).map((chord) => [chord.key, chord]));
    expect(byKey.get('d1')?.romanNumeral).toBe('I');
    expect(byKey.get('d2')?.romanNumeral).toBe('ii');
    expect(byKey.get('d7')?.romanNumeral).toBe('vii°');
    expect(byKey.get('d5x7')?.quality).toBe('dominant_seventh');
    expect(byKey.get('d1')?.pitchClasses).toEqual([0, 4, 7]);
  });

  it('includes the raised-leading-tone V in minor', () => {
    const chords = enumerateChords(A_MINOR);
    const raised = (chords ?? []).find((chord) => chord.key === 'd5raised');
    expect(raised?.romanNumeral).toBe('V');
    // E major in A minor: E (4), G# (8), B (11).
    expect(raised?.pitchClasses).toEqual([4, 8, 11]);
    expect(raised?.members[1]).toEqual({ degree: 7, chromaticOffset: 1 });
  });
});

describe('assembleSkeletons', () => {
  it('generates three distinct, deterministic skeletons for the sol–fa–mi melody', () => {
    const first = assembleSkeletons(fragment, C_MAJOR, 'continue');
    const second = assembleSkeletons(fragment, C_MAJOR, 'continue');
    expect(first).toHaveLength(3);
    expect(first.map((candidate) => candidate.id)).toEqual(
      second.map((candidate) => candidate.id),
    );
    const ids = new Set(first.map((candidate) => candidate.id));
    expect(ids.size).toBe(3);
    for (const candidate of first) {
      expect(candidate.provenance.fixtureAuthored).toBe(false);
      expect(candidate.provenance.generatorId).toBe('naive-enumerator');
      expect(candidate.derivability?.length).toBeGreaterThan(0);
      // Every chord chosen must contain its melody note (membership honesty).
      for (const interpretation of candidate.melodyInterpretations) {
        expect(interpretation.role).toBe('chord_tone');
      }
      // Naive voicing exists for playback and renders in all four lanes.
      expect(candidate.voicing.soprano).toHaveLength(3);
      expect(candidate.voicing.bass.length).toBeGreaterThan(0);
    }
  });

  it('filters by locked pitches and returns [] when over-constrained', () => {
    // Lock pitch-class 11 (B) across the whole fragment: only chords containing
    // B survive; the melody note fa (F) shares no triad with B except V7/vii°.
    const constrained = assembleSkeletons(fragment, C_MAJOR, 'continue', [
      { startUnit: 0, units: 16, pitchClass: 11 },
    ]);
    for (const candidate of constrained) {
      for (const harmony of candidate.harmonyEvents) {
        expect(harmony.chord.pitchClasses).toContain(11);
      }
    }
    // An impossible lock (pitch class outside every supporting chord) → [].
    const impossible = assembleSkeletons(fragment, C_MAJOR, 'continue', [
      { startUnit: 0, units: 16, pitchClass: 1 },
    ]);
    expect(impossible).toEqual([]);
  });

  it('returns [] for unsupported contexts and empty fragments', () => {
    expect(
      assembleSkeletons(fragment, { ...A_MINOR, minorDoSystem: 'do_based' }, 'continue'),
    ).toEqual([]);
    expect(assembleSkeletons({ id: 'empty', events: [] }, C_MAJOR, 'continue')).toEqual([]);
  });
});
