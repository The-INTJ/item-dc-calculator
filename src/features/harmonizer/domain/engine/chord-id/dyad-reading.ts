/**
 * Two-pc readings: a bare fifth is a first-class open fifth, a root+third dyad
 * asserts its quality but claims no fifth, and other dyads name the interval
 * and offer candidate readings rather than over-claiming one chord.
 */

import type { SpelledPitch, SpelledPitchClass } from '../../music-types';
import { spelledInterval } from '../tonal-bridge';
import { toPc, type SonorityReading } from './sonority-reading';

export function readDyad(pitches: SpelledPitch[], tones: SpelledPitchClass[]): SonorityReading {
  const low = pitches[0];
  // With doublings (C3+E3+C4) the top note can share the bass pc — the second
  // tone is the lowest instance of the OTHER pitch class.
  const high = pitches.find((pitch) => pitch.pitchClass !== low.pitchClass) ?? pitches[0];
  const semitones = (high.pitchClass - low.pitchClass + 12) % 12;
  if (semitones === 7) {
    return { kind: 'open_fifth', root: toPc(low), tones };
  }
  if (semitones === 3 || semitones === 4) {
    return {
      kind: 'incomplete_triad',
      root: toPc(low),
      quality: semitones === 4 ? 'major' : 'minor',
      missing: 'fifth',
      tones,
    };
  }
  const interval = spelledInterval(low, high);
  // Inverted thirds (sixths): the upper note reads as the root of a fifth-less
  // triad — offered as a candidate, not asserted (music21's restraint).
  const candidates: SonorityReading[] =
    semitones === 8 || semitones === 9
      ? [
          {
            kind: 'incomplete_triad',
            root: toPc(high),
            quality: semitones === 8 ? 'major' : 'minor',
            missing: 'fifth',
            tones,
          },
        ]
      : [];
  return { kind: 'dyad', interval, tones, candidates };
}
