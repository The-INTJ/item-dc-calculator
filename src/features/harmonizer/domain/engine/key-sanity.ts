/**
 * Key sanity check — a gentle "these notes look like G major" flag when the
 * duration-weighted pitch-class profile of the surface clearly prefers a key
 * other than the declared one. Krumhansl–Kessler profiles, Pearson
 * correlation, 24 rotations. Deliberately quiet: it fires only on a clear
 * margin, and NEVER for the relative major/minor pair — la-based minor makes
 * that distinction meaningless for these users.
 */

import type { SATBVoicing, TonalContext } from '../music-types';
import { toTimelineSpan } from '../timing';
import { makeEvidence } from './evidence';
import type { AnalysisEvidence } from '../analysis-types';

/** Krumhansl–Kessler key profiles (Music Perception, 1982). */
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

/** Clear-margin threshold on the correlation difference. */
const MARGIN = 0.1;

const PC_NAMES = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];

function correlation(a: number[], b: number[]): number {
  const n = a.length;
  const meanA = a.reduce((sum, value) => sum + value, 0) / n;
  const meanB = b.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < n; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    numerator += da * db;
    denomA += da * da;
    denomB += db * db;
  }
  const denominator = Math.sqrt(denomA * denomB);
  return denominator === 0 ? 0 : numerator / denominator;
}

function durationWeightedProfile(voicing: SATBVoicing): number[] | null {
  const vector = new Array<number>(12).fill(0);
  let total = 0;
  for (const events of [voicing.soprano, voicing.alto, voicing.tenor, voicing.bass]) {
    for (const event of events) {
      if (event.isRest) continue; // silence is not evidence for a key
      const span = toTimelineSpan(event.start, event.duration);
      vector[event.pitch.pitchClass] += span.spanUnits;
      total += span.spanUnits;
    }
  }
  return total === 0 ? null : vector;
}

interface KeyScore {
  tonicPc: number;
  mode: 'major' | 'minor';
  score: number;
}

/**
 * Null when the declared key stands (the usual case); an evidence entry when
 * another key wins by a clear margin.
 */
export function keySanityCheck(
  voicing: SATBVoicing,
  context: TonalContext,
  idSeed: string,
): AnalysisEvidence | null {
  const vector = durationWeightedProfile(voicing);
  if (!vector) return null;

  const scores: KeyScore[] = [];
  for (let tonicPc = 0; tonicPc < 12; tonicPc += 1) {
    for (const mode of ['major', 'minor'] as const) {
      const profile = mode === 'major' ? MAJOR_PROFILE : MINOR_PROFILE;
      const rotated = vector.map((_, i) => vector[(i + tonicPc) % 12]);
      scores.push({ tonicPc, mode, score: correlation(rotated, profile) });
    }
  }
  scores.sort((a, b) => b.score - a.score);

  const declaredMode = context.mode === 'major' ? 'major' : 'minor';
  const declared = scores.find(
    (entry) => entry.tonicPc === context.tonicPitchClass && entry.mode === declaredMode,
  );
  const best = scores[0];
  if (!declared || best === declared) return null;
  if (best.tonicPc === context.tonicPitchClass && best.mode === declaredMode) return null;

  // Relative-pair confusions are not worth flagging.
  const relativeOfDeclared =
    declaredMode === 'major'
      ? { tonicPc: (context.tonicPitchClass + 9) % 12, mode: 'minor' as const }
      : { tonicPc: (context.tonicPitchClass + 3) % 12, mode: 'major' as const };
  if (best.tonicPc === relativeOfDeclared.tonicPc && best.mode === relativeOfDeclared.mode) {
    return null;
  }

  if (best.score - declared.score < MARGIN) return null;

  const suggestion = `${PC_NAMES[best.tonicPc]} ${best.mode}`;
  return makeEvidence(
    idSeed,
    'key_profile_mismatch',
    suggestion,
    `Taken together, these notes lean toward ${suggestion} more than the selected key — worth a listen before trusting the readings.`,
  );
}
