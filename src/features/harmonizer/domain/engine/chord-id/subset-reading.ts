/**
 * Subset readings for 5+ pc or unmatched sets: try 3–4-pc subsets, let the
 * best subset explain the chord, and hand the leftovers to the classifier as
 * non-chord-tone candidates (slice 3 threads resolution evidence into the
 * scoring hook).
 */

import type { SpelledPitchClass } from '../../music-types';
import { exactMatch, rootOrderFor, stackedTones } from './template-match';
import type { SonorityTemplate } from './sonority-templates';
import type { IdentifySonorityInput, SonorityReading } from './sonority-reading';

/** All k-element subsets of an index range, in lexicographic order. */
function indexSubsets(n: number, k: number): number[][] {
  const results: number[][] = [];
  const pick = (start: number, current: number[]) => {
    if (current.length === k) {
      results.push([...current]);
      return;
    }
    for (let i = start; i <= n - (k - current.length); i += 1) {
      current.push(i);
      pick(i + 1, current);
      current.pop();
    }
  };
  pick(0, []);
  return results;
}

export function readSubset(input: IdentifySonorityInput, tones: SpelledPitchClass[]): SonorityReading {
  const pcs = tones.map((tone) => tone.pitchClass);
  let best: {
    score: number;
    tieBreak: string;
    rootPc: number;
    template: SonorityTemplate;
    subset: SpelledPitchClass[];
  } | null = null;

  const maxSize = Math.min(4, pcs.length - 1);
  for (let size = maxSize; size >= 3; size -= 1) {
    for (const indices of indexSubsets(pcs.length, size)) {
      const subsetTones = indices.map((i) => tones[i]);
      const subsetPcs = subsetTones.map((tone) => tone.pitchClass);
      const bassIn = subsetPcs.includes(input.bassPc);
      const order = bassIn
        ? rootOrderFor(subsetPcs, input.bassPc)
        : subsetPcs;
      const match = exactMatch(subsetPcs, order);
      if (!match) continue;
      const leftoverPitches = input.pitches.filter(
        (pitch) => !subsetPcs.includes(pitch.pitchClass),
      );
      const plausibility = input.leftoverPlausibility
        ? leftoverPitches.reduce((sum, pitch) => sum + input.leftoverPlausibility!(pitch), 0)
        : 0;
      const score = size * 10 + (bassIn ? 5 : 0) + plausibility;
      const tieBreak = subsetPcs.join('.');
      if (
        !best ||
        score > best.score ||
        (score === best.score && tieBreak < best.tieBreak)
      ) {
        best = { score, tieBreak, rootPc: match.rootPc, template: match.template, subset: subsetTones };
      }
    }
    if (best) break; // larger subsets always beat smaller ones — stop at the first size with a match
  }

  if (!best) return { kind: 'unknown', tones };
  const subsetPcSet = new Set(best.subset.map((tone) => tone.pitchClass));
  return {
    kind: 'subset',
    root: best.subset.find((tone) => tone.pitchClass === best!.rootPc) ?? best.subset[0],
    quality: best.template.quality,
    template: best.template,
    tones: stackedTones(best.subset, best.rootPc, best.template),
    leftovers: input.pitches
      .filter((pitch) => !subsetPcSet.has(pitch.pitchClass))
      .map((pitch) => ({ pitch })),
  };
}
