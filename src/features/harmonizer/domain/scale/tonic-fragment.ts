/**
 * The Blank next-fragment: the tonic whole note a fresh fragment starts from.
 */

import type { MelodyFragment, TonalContext } from '../music-types';
import { diatonicPitch } from './diatonic-degrees';
import { modeTable } from './mode-tables';

/** The Blank next-fragment: one tonic whole note (do / la) in octave 4. */
export function tonicWholeNoteFragment(
  context: TonalContext,
  fragmentId: string,
  eventId: string,
): MelodyFragment | null {
  const table = modeTable(context);
  const pitch = diatonicPitch(context, 1, 4);
  if (!table || !pitch) return null;
  return {
    id: fragmentId,
    events: [
      {
        id: eventId,
        pitch,
        scaleDegree: { degree: 1, chromaticOffset: 0, syllable: table.syllables[0] },
        start: { measure: 1, beat: 1, subdivision: 0 },
        duration: { numerator: 1, denominator: 1 },
        tieFromPrevious: false,
        metricStrength: 'strong',
      },
    ],
  };
}
