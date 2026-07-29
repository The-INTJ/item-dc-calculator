/**
 * Authored previous-harmony options for the accepted-context editor (spec
 * §8.1: previous harmony, editable). Small, per-context, deterministic ids.
 */

import type { ChordStructure, HarmonyEvent, TonalContext } from '../domain/music-types';
import { at, deg, pc, pitch, W } from './authoring';

const C_MAJOR_TRIAD: ChordStructure = {
  id: 'chord-c-major',
  root: pc('C'),
  pitchClasses: [0, 4, 7],
  spelledChordTones: [pc('C'), pc('E'), pc('G')],
  quality: 'major',
};
const G_MAJOR_TRIAD: ChordStructure = {
  id: 'chord-g-major',
  root: pc('G'),
  pitchClasses: [7, 11, 2],
  spelledChordTones: [pc('G'), pc('B'), pc('D')],
  quality: 'major',
};
const A_MINOR_TRIAD: ChordStructure = {
  id: 'chord-a-minor',
  root: pc('A'),
  pitchClasses: [9, 0, 4],
  spelledChordTones: [pc('A'), pc('C'), pc('E')],
  quality: 'minor',
};
const E_MAJOR_TRIAD: ChordStructure = {
  id: 'chord-e-major',
  root: pc('E'),
  pitchClasses: [4, 8, 11],
  spelledChordTones: [pc('E'), pc('G#'), pc('B')],
  quality: 'major',
};

function option(
  id: string,
  chord: ChordStructure,
  romanNumeral: string,
  rootDegree: Parameters<typeof deg>[0],
  rootSyllable: Parameters<typeof deg>[1],
  inversion: 0 | 1,
  bass: string,
  displaySymbol: string,
): HarmonyEvent {
  return {
    id,
    start: at(0, 1),
    duration: W,
    chord,
    analysis: {
      romanNumeral,
      scaleDegreeRoot: deg(rootDegree, rootSyllable),
      functionTags: romanNumeral.toLowerCase().startsWith('v') ? ['dominant'] : ['tonic'],
    },
    inversion,
    bassPitch: pitch(bass),
    displaySymbol,
    ...(inversion === 1 ? { figuredBass: '6' } : {}),
  };
}

export function listAcceptedHarmonyOptions(context: TonalContext): HarmonyEvent[] {
  if (context.mode === 'major' && context.tonicPitchClass === 0) {
    return [
      option('accepted-c-i', C_MAJOR_TRIAD, 'I', 1, 'do', 0, 'C3', 'C'),
      option('accepted-c-i6', C_MAJOR_TRIAD, 'I6', 1, 'do', 1, 'E3', 'C/E'),
      option('accepted-c-v', G_MAJOR_TRIAD, 'V', 5, 'sol', 0, 'G2', 'G'),
    ];
  }
  if (context.mode === 'natural_minor' && context.tonicPitchClass === 9) {
    return [
      option('accepted-a-i', A_MINOR_TRIAD, 'i', 1, 'la', 0, 'A2', 'Am'),
      option('accepted-a-v', E_MAJOR_TRIAD, 'V', 5, 'mi', 0, 'E3', 'E'),
    ];
  }
  return [];
}
