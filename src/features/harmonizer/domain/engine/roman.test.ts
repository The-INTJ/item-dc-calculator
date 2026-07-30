import { describe, expect, it } from 'vitest';
import type { SpelledPitch, TonalContext } from '../music-types';
import { parsePitch, parsePitchClass } from '../pitch';
import { identifySonority } from './chord-id';
import { analyzeInKey, degreeForSpelledRoot } from './roman';

const C_MAJOR: TonalContext = {
  tonic: parsePitchClass('C'),
  tonicPitchClass: 0,
  mode: 'major',
  solfegeSystem: 'movable_do',
};

const A_MINOR: TonalContext = {
  tonic: parsePitchClass('A'),
  tonicPitchClass: 9,
  mode: 'natural_minor',
  minorDoSystem: 'la_based',
  solfegeSystem: 'movable_do',
};

const EB_MAJOR: TonalContext = {
  tonic: parsePitchClass('Eb'),
  tonicPitchClass: 3,
  mode: 'major',
  solfegeSystem: 'movable_do',
};

function read(context: TonalContext, ...spns: string[]) {
  const pitches = spns.map(parsePitch).sort((a, b) => a.midi - b.midi);
  const reading = identifySonority({ pitches, bassPc: pitches[0].pitchClass });
  return analyzeInKey(context, reading, pitches[0] as SpelledPitch);
}

describe('degreeForSpelledRoot — spelling-faithful degrees', () => {
  it('reads Bb in C major as lowered 7, and A# as raised 6', () => {
    expect(degreeForSpelledRoot(C_MAJOR, parsePitchClass('Bb'))).toEqual({
      degree: 7,
      chromaticOffset: -1,
    });
    expect(degreeForSpelledRoot(C_MAJOR, parsePitchClass('A#'))).toEqual({
      degree: 6,
      chromaticOffset: 1,
    });
  });

  it('works from any tonic (Ab in Eb major = 4, D natural = 7)', () => {
    expect(degreeForSpelledRoot(EB_MAJOR, parsePitchClass('Ab'))).toEqual({
      degree: 4,
      chromaticOffset: 0,
    });
    expect(degreeForSpelledRoot(EB_MAJOR, parsePitchClass('D'))).toEqual({
      degree: 7,
      chromaticOffset: 0,
    });
  });
});

describe('analyzeInKey', () => {
  it('gives inversion figures: I6 with slash symbol and figured bass', () => {
    const result = read(C_MAJOR, 'E3', 'C4', 'G4', 'C5');
    expect(result.analysis.romanNumeral).toBe('I6');
    expect(result.displaySymbol).toBe('C/E');
    expect(result.figuredBass).toBe('6');
    expect(result.inversion).toBe(1);
  });

  it('reads seventh-chord inversions with quality markers (V6/5, i7)', () => {
    const v65 = read(C_MAJOR, 'B2', 'D4', 'F4', 'G4');
    expect(v65.analysis.romanNumeral).toBe('V6/5');
    expect(v65.displaySymbol).toBe('G7/B');
    expect(v65.figuredBass).toBe('6/5');

    const i7 = read(A_MINOR, 'A2', 'C4', 'E4', 'G4');
    expect(i7.analysis.romanNumeral).toBe('i7');
    expect(i7.figuredBass).toBe('7');
  });

  it('prefixes lowered chromatic roots with b (Bb major chord in C = bVII)', () => {
    const result = read(C_MAJOR, 'Bb3', 'D4', 'F4');
    expect(result.analysis.romanNumeral).toBe('bVII');
    expect(result.analysis.scaleDegreeRoot.syllable).toBe('te');
    expect(result.analysis.functionTags).toEqual(['ambiguous']);
  });

  it('keeps the raised leading tone dominant in la-based minor', () => {
    // E-G#-B in A minor: major V with si.
    const result = read(A_MINOR, 'E3', 'G#3', 'B3');
    expect(result.analysis.romanNumeral).toBe('V');
    expect(result.analysis.functionTags).toEqual(['dominant']);
  });

  it('upgrades a diatonic open fifth to its degree and C5 symbol', () => {
    const result = read(C_MAJOR, 'G2', 'D3', 'G3');
    expect(result.displaySymbol).toBe('G5');
    expect(result.analysis.romanNumeral).toBe('V');
    expect(result.analysis.functionTags).toEqual(['dominant']);
  });

  it('asserts quality for an incomplete triad without claiming the fifth', () => {
    const result = read(C_MAJOR, 'C3', 'E4');
    expect(result.displaySymbol).toBe('C(no 5)');
    expect(result.analysis.romanNumeral).toBe('I');
  });

  it('shows honest ? for dyads and unknown clusters', () => {
    const second = read(C_MAJOR, 'E4', 'F4');
    expect(second.analysis.romanNumeral).toBe('?');
    expect(second.displaySymbol).toBe('E+F');

    const cluster = read(C_MAJOR, 'C4', 'D4', 'E4');
    expect(cluster.analysis.romanNumeral).toBe('?');
    expect(cluster.displaySymbol).toBe('C+D+E');
  });

  it('reads a subset chord with its leftover shown as a slashless chord symbol', () => {
    const result = read(C_MAJOR, 'G2', 'B3', 'D4', 'F4', 'C5');
    expect(result.analysis.romanNumeral).toBe('V7');
    expect(result.displaySymbol).toBe('G7');
    expect(result.analysis.functionTags).toEqual(['dominant']);
  });

  it('works identically in a flat key (Ab-C-Eb in Eb major = IV)', () => {
    const result = read(EB_MAJOR, 'Ab2', 'C4', 'Eb4');
    expect(result.analysis.romanNumeral).toBe('IV');
    expect(result.displaySymbol).toBe('Ab');
    expect(result.analysis.functionTags).toEqual(['predominant']);
  });
});
