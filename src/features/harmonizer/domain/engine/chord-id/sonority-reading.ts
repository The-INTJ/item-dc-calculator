/**
 * The reading vocabulary the namer returns — every honesty level between
 * "full match" and "unknown" — plus the tone-extraction helpers that turn
 * sounding pitches into the spelled tone material a reading carries.
 */

import type { ChordQuality, SpelledPitch, SpelledPitchClass, VoiceId } from '../../music-types';
import type { SonorityTemplate } from './sonority-templates';

/** A sounding note the chosen subset does not explain — an NCT candidate. */
export interface LeftoverNote {
  pitch: SpelledPitch;
  /** Voice the note sounds in, when the caller knows it. */
  voice?: VoiceId;
}

export type SonorityReading =
  | {
      kind: 'exact';
      root: SpelledPitchClass;
      quality: ChordQuality;
      template: SonorityTemplate;
      tones: SpelledPitchClass[];
    }
  | {
      kind: 'incomplete_triad';
      root: SpelledPitchClass;
      quality: 'major' | 'minor';
      missing: 'fifth';
      tones: SpelledPitchClass[];
    }
  | { kind: 'open_fifth'; root: SpelledPitchClass; tones: SpelledPitchClass[] }
  | {
      kind: 'dyad';
      /** tonal shorthand from the sounding pitches, e.g. "3M", "6m", "4P". */
      interval: string;
      tones: SpelledPitchClass[];
      candidates: SonorityReading[];
    }
  | {
      kind: 'subset';
      root: SpelledPitchClass;
      quality: ChordQuality;
      template: SonorityTemplate;
      tones: SpelledPitchClass[];
      leftovers: LeftoverNote[];
    }
  | { kind: 'monad'; tone: SpelledPitchClass }
  | { kind: 'unknown'; tones: SpelledPitchClass[] };

export interface IdentifySonorityInput {
  /** All sounding pitches, lowest first, midi-deduped. */
  pitches: SpelledPitch[];
  bassPc: number;
  metricStrength?: 'strong' | 'medium' | 'weak';
  /**
   * Slice-3 hook: plausibility (0..1) that a leftover pitch class is an
   * ornamental tone (metric weight + resolves-by-step-soon). Absent → 0.
   */
  leftoverPlausibility?: (pitch: SpelledPitch) => number;
}

export function toPc(pitch: SpelledPitch): SpelledPitchClass {
  return { letter: pitch.letter, accidental: pitch.accidental, pitchClass: pitch.pitchClass };
}

/** Distinct pitch classes in low-to-high first-appearance order, with spellings. */
export function distinctTones(pitches: SpelledPitch[]): SpelledPitchClass[] {
  const tones: SpelledPitchClass[] = [];
  for (const pitch of pitches) {
    if (!tones.some((tone) => tone.pitchClass === pitch.pitchClass)) tones.push(toPc(pitch));
  }
  return tones;
}
