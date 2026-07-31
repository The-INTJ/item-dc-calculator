/**
 * Shared surface-state machinery for the voice-leading fact families: the
 * voice order, human labels, hymnal-practical ranges, and the "what sounds in
 * each voice at a unit" snapshot the checkers walk.
 */

import type { SpelledPitch, VoiceId } from '../../music-types';
import type { PlacedVoiceNote } from '../segmentation';

export const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];
export const VOICE_LABEL: Record<VoiceId, string> = {
  soprano: 'soprano',
  alto: 'alto',
  tenor: 'tenor',
  bass: 'bass',
};

/** Hymnal-practical ranges (midi): comfortable congregational envelopes. */
export const RANGES: Record<VoiceId, { low: number; high: number }> = {
  soprano: { low: 60, high: 79 }, // C4–G5
  alto: { low: 55, high: 74 }, // G3–D5
  tenor: { low: 48, high: 67 }, // C3–G4
  bass: { low: 40, high: 60 }, // E2–C4
};

export type VoiceState = Partial<Record<VoiceId, PlacedVoiceNote>>;

/** The note sounding in each voice at a unit. */
export function stateAt(lines: Record<VoiceId, PlacedVoiceNote[]>, unit: number): VoiceState {
  const state: VoiceState = {};
  for (const voice of VOICES) {
    const note = lines[voice].find(
      (candidate) => candidate.startUnit <= unit && unit < candidate.startUnit + candidate.units,
    );
    if (note) state[voice] = note;
  }
  return state;
}

export function simpleIntervalClass(a: SpelledPitch, b: SpelledPitch): number {
  return Math.abs(a.midi - b.midi) % 12;
}

/** All state boundaries — the starts of every note. */
export function boundaries(lines: Record<VoiceId, PlacedVoiceNote[]>): number[] {
  return [...new Set(VOICES.flatMap((voice) => lines[voice].map((note) => note.startUnit)))].sort(
    (a, b) => a - b,
  );
}
