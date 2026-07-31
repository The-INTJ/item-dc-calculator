/**
 * The full chord shapes the namer recognizes, with their symbol and
 * roman-numeral suffixes.
 */

import type { ChordQuality } from '../../music-types';

export interface SonorityTemplate {
  intervals: number[];
  quality: ChordQuality;
  /** Chord-symbol suffix (Cm7, G7, Fdim…). */
  suffix: string;
  /** Roman-numeral suffix (V7, ii7, vii°7…). */
  numeralSuffix: string;
  lowercaseNumeral: boolean;
}

/** Every full shape the namer recognizes, checked with each sounding pc as root. */
export const SONORITY_TEMPLATES: SonorityTemplate[] = [
  { intervals: [0, 4, 7], quality: 'major', suffix: '', numeralSuffix: '', lowercaseNumeral: false },
  { intervals: [0, 3, 7], quality: 'minor', suffix: 'm', numeralSuffix: '', lowercaseNumeral: true },
  { intervals: [0, 3, 6], quality: 'diminished', suffix: 'dim', numeralSuffix: '°', lowercaseNumeral: true },
  { intervals: [0, 4, 8], quality: 'augmented', suffix: 'aug', numeralSuffix: '+', lowercaseNumeral: false },
  { intervals: [0, 4, 7, 10], quality: 'dominant_seventh', suffix: '7', numeralSuffix: '7', lowercaseNumeral: false },
  { intervals: [0, 4, 7, 11], quality: 'major_seventh', suffix: 'maj7', numeralSuffix: 'maj7', lowercaseNumeral: false },
  { intervals: [0, 3, 7, 10], quality: 'minor_seventh', suffix: 'm7', numeralSuffix: '7', lowercaseNumeral: true },
  { intervals: [0, 3, 6, 10], quality: 'half_diminished_seventh', suffix: 'ø7', numeralSuffix: 'ø7', lowercaseNumeral: true },
  { intervals: [0, 3, 6, 9], quality: 'fully_diminished_seventh', suffix: '°7', numeralSuffix: '°7', lowercaseNumeral: true },
  { intervals: [0, 5, 7], quality: 'suspended_fourth', suffix: 'sus4', numeralSuffix: 'sus4', lowercaseNumeral: false },
  { intervals: [0, 2, 7], quality: 'suspended_second', suffix: 'sus2', numeralSuffix: 'sus2', lowercaseNumeral: false },
];

export function templateForQuality(quality: ChordQuality): SonorityTemplate | null {
  return SONORITY_TEMPLATES.find((template) => template.quality === quality) ?? null;
}
