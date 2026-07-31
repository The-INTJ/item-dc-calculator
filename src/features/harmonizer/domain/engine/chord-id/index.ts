/**
 * Key-agnostic sonority naming — the fallback ladder that replaces the POC's
 * exact-match-or-`?` namer. Bass-first exact template matching survives
 * verbatim; what's new is honesty BETWEEN "full match" and "unknown":
 *
 * - a root+third dyad asserts its quality but claims no fifth;
 * - a bare fifth is a first-class open fifth (the old books use them freely),
 *   never an error;
 * - other dyads name the interval and offer candidate readings rather than
 *   over-claiming one chord (music21's posture);
 * - a 5+ pc or unmatched set tries 3–4-pc subsets: the best subset explains
 *   the chord and the leftovers become non-chord-tone candidates for the
 *   classifier (slice 3 threads resolution evidence into the scoring hook).
 *
 * Everything here is spelling-preserving and deterministic. Key-aware
 * decisions (roman numerals, diatonic upgrades) live in engine/roman.ts.
 */

import type { ChordQuality } from '../../music-types';
import { readDyad } from './dyad-reading';
import { distinctTones, type IdentifySonorityInput, type SonorityReading } from './sonority-reading';
import { SONORITY_TEMPLATES } from './sonority-templates';
import { readSubset } from './subset-reading';
import { exactMatch, rootOrderFor, stackedTones } from './template-match';

export { SONORITY_TEMPLATES, templateForQuality, type SonorityTemplate } from './sonority-templates';
export type { IdentifySonorityInput, LeftoverNote, SonorityReading } from './sonority-reading';

/** Name what sounds — always returns a reading; `unknown` is the honest floor. */
export function identifySonority(input: IdentifySonorityInput): SonorityReading {
  const tones = distinctTones(input.pitches);
  if (tones.length === 0) return { kind: 'unknown', tones: [] };
  if (tones.length === 1) return { kind: 'monad', tone: tones[0] };
  if (tones.length === 2) return readDyad(input.pitches, tones);

  const pcs = tones.map((tone) => tone.pitchClass);
  const match = exactMatch(pcs, rootOrderFor(pcs, input.bassPc));
  if (match) {
    return {
      kind: 'exact',
      root: tones.find((tone) => tone.pitchClass === match.rootPc) ?? tones[0],
      quality: match.template.quality,
      template: match.template,
      tones: stackedTones(tones, match.rootPc, match.template),
    };
  }
  // Fifth-less sevenths — the TEXTBOOK four-voice V7 drops its fifth, so
  // {root, 3rd, 7th} must read as the seventh chord, not as `?`.
  if (pcs.length === 3) {
    const fifthless: Array<{ intervals: [number, number]; quality: ChordQuality }> = [
      { intervals: [4, 10], quality: 'dominant_seventh' },
      { intervals: [3, 10], quality: 'minor_seventh' },
      { intervals: [4, 11], quality: 'major_seventh' },
    ];
    for (const rootPc of rootOrderFor(pcs, input.bassPc)) {
      const relative = new Set(pcs.map((pc) => (pc - rootPc + 12) % 12));
      for (const shape of fifthless) {
        if (relative.has(shape.intervals[0]) && relative.has(shape.intervals[1])) {
          const template = SONORITY_TEMPLATES.find((entry) => entry.quality === shape.quality)!;
          return {
            kind: 'subset',
            root: tones.find((tone) => tone.pitchClass === rootPc) ?? tones[0],
            quality: shape.quality,
            template,
            tones: stackedTones(tones, rootPc, template),
            leftovers: [],
          };
        }
      }
    }
  }
  return readSubset(input, tones);
}
