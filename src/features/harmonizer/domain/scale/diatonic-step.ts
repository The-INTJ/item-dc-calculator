/**
 * Stepwise diatonic motion — the arrow-key primitive that moves a note to the
 * adjacent scale degree while honoring chromatic inflections.
 */

import type { DiatonicDegree, ScaleDegreePitch, SpelledPitch, TonalContext } from '../music-types';
import { diatonicPitch } from './diatonic-degrees';
import { modeTable } from './mode-tables';

/** Hard range for pitch stepping — beyond it the arrows no-op. */
export const MIN_MIDI = 36; // C2
export const MAX_MIDI = 84; // C6

/**
 * Step a note to the adjacent diatonic degree. Chromatic sources follow the
 * inflection: stepping AGAINST the inflection lands on the same degree natural
 * (si ↓ → sol♮, se ↑ → sol♮); stepping WITH it lands on the adjacent diatonic
 * degree (si ↑ → la). Returns null when the context is unsupported or the
 * result leaves the MIDI range.
 */
export function stepDiatonic(
  context: TonalContext,
  from: { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch },
  direction: 1 | -1,
): { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch } | null {
  const table = modeTable(context);
  if (!table) return null;

  const inflection = from.scaleDegree.chromaticOffset;
  const steppingAgainstInflection =
    (inflection > 0 && direction === -1) || (inflection < 0 && direction === 1);
  let nextDegree: DiatonicDegree;
  if (steppingAgainstInflection) {
    nextDegree = from.scaleDegree.degree; // the inflection steps off itself
  } else {
    let degree = (from.scaleDegree.degree + direction) as number;
    if (degree > 7) degree = 1;
    if (degree < 1) degree = 7;
    nextDegree = degree as DiatonicDegree;
  }

  // Try the same letter-octave first, then adjust one octave in the step's
  // direction until the midi moves the right way.
  let pitch = diatonicPitch(context, nextDegree, from.pitch.octave);
  if (!pitch) return null;
  if (direction === 1 && pitch.midi <= from.pitch.midi) {
    pitch = diatonicPitch(context, nextDegree, from.pitch.octave + 1);
  } else if (direction === -1 && pitch.midi >= from.pitch.midi) {
    pitch = diatonicPitch(context, nextDegree, from.pitch.octave - 1);
  }
  if (!pitch || pitch.midi < MIN_MIDI || pitch.midi > MAX_MIDI) return null;
  const syllable = table.syllables[nextDegree - 1];
  return {
    pitch,
    scaleDegree: { degree: nextDegree, chromaticOffset: 0, syllable },
  };
}
