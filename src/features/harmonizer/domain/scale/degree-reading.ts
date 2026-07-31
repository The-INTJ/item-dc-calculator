/**
 * Reading pitches back as scale degrees: the best-effort pitch-class reading
 * and the total spelled re-reading that powers key changes.
 */

import type {
  DiatonicDegree,
  ScaleDegreePitch,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from '../music-types';
import { ACCIDENTAL_OFFSETS, LETTERS } from '../pitch';
import { modeTable, syllableForDegree } from './mode-tables';
import { diatonicPitch } from './diatonic-degrees';

/**
 * Best-effort scale degree for a bare pitch class: diatonic first, then the
 * preferred chromatic side, then the other. `prefer` defaults to 'raised' so
 * existing call sites keep their behavior; key-relative readings of flat-side
 * roots (bVII, bVI) pass 'lowered'.
 */
export function scaleDegreeForPitchClass(
  context: TonalContext,
  pitchClass: number,
  prefer: 'raised' | 'lowered' = 'raised',
): ScaleDegreePitch | null {
  const table = modeTable(context);
  if (!table) return null;
  const offsets = prefer === 'raised' ? [0, 1, -1] : [0, -1, 1];
  for (const chromaticOffset of offsets) {
    for (let d = 1; d <= 7; d += 1) {
      const degree = d as DiatonicDegree;
      const pc =
        (((context.tonicPitchClass + table.intervals[degree - 1] + chromaticOffset) % 12) + 12) %
        12;
      if (pc === pitchClass) {
        const syllable = syllableForDegree(context, degree, chromaticOffset);
        if (!syllable) continue; // syllable gap (mi#/ti#) — try the other reading
        return { degree, chromaticOffset, syllable };
      }
    }
  }
  return null;
}

/**
 * Re-read a pitch's scale degree in a context — the key-change primitive.
 * TOTAL for every supported context: the pitch NEVER moves; only the reading
 * changes. Spelling decides the degree (letter distance from the tonic letter,
 * accidental delta as the chromatic offset), so F# in C major reads fi and Gb
 * reads se. Falls back to an enharmonic pitch-class reading when the spelled
 * offset exceeds ±1 or hits a syllable gap (mi#/ti#), and to the bare letter
 * degree as a last resort. Null ONLY for unsupported modes.
 */
export function respellDegree(
  context: TonalContext,
  pitch: SpelledPitch | SpelledPitchClass,
): ScaleDegreePitch | null {
  const table = modeTable(context);
  if (!table) return null;
  const tonicIndex = LETTERS.indexOf(context.tonic.letter);
  const letterIndex = LETTERS.indexOf(pitch.letter);
  const degree = (((letterIndex - tonicIndex + 7) % 7) + 1) as DiatonicDegree;

  const diatonic = diatonicPitch(context, degree, 4);
  if (diatonic) {
    const offset = ACCIDENTAL_OFFSETS[pitch.accidental] - ACCIDENTAL_OFFSETS[diatonic.accidental];
    if (offset >= -1 && offset <= 1) {
      const syllable = syllableForDegree(context, degree, offset);
      if (syllable) return { degree, chromaticOffset: offset, syllable };
    }
    // Spelled reading unavailable (double-inflection or syllable gap) — try
    // the enharmonic reading on the side the spelling leans toward.
    const enharmonic = scaleDegreeForPitchClass(
      context,
      pitch.pitchClass,
      offset < 0 ? 'lowered' : 'raised',
    );
    if (enharmonic) return enharmonic;
  }
  // Last resort: the letter degree read diatonically. Reachable only for
  // pathological spellings; totality matters more than the lost inflection.
  return { degree, chromaticOffset: 0, syllable: table.syllables[degree - 1] };
}
