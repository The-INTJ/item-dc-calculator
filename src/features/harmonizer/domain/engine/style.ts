/**
 * The StylePack — every judgment knob the generator consults, in one typed
 * object. The math in generate.ts proposes and measures; how much anything
 * MATTERS (a retrogression, a parallel fifth, a ti-chord under a gapped tune)
 * comes exclusively from here. Costs are non-negative numbers, lower = more
 * idiomatic; a cost of 0 means "no opinion".
 *
 * DEFAULT_STYLE_PACK encodes the researched hymnal baseline: McHose's chord
 * prevalences from the chorale corpus (I 38%, V 28%, IV 11%, ii 8%, vii° 6%,
 * vi 6.4%, iii ~1%), the tonic→predominant→dominant→tonic cycle with directed
 * transitions, de Clercq's cadence census (authentic 73%, half 21%, plagal 2%,
 * deceptive 1.5%), and the community's tone rules (parallels and open fifths
 * are stylistic observations, never errors). The hymnal-default knowledge pack
 * (slice 6) supplies these same numbers as versioned data.
 */

import type { PhraseIntent } from '../music-types';
import type { MetricStrength } from '../timing';
import type { VoiceLeadingFactId } from './voice-leading';

export type CadenceType = 'authentic' | 'half' | 'plagal' | 'deceptive';

/** A generation-vocabulary chord as the DP sees it. */
export interface VocabChord {
  /** Stable key, e.g. "d5", "d5x7", "d5raised". */
  key: string;
  rootDegree: number;
  /** True for the conventionally raised leading tone chords in minor. */
  raisedLeadingTone: boolean;
  isSeventh: boolean;
  containsLeadingTone: boolean;
}

export interface StylePack {
  id: string;
  version: string;
  /** Stage A: melody note's role in the chord. */
  emissionCost(role: 'root' | 'third' | 'fifth' | 'seventh'): number;
  /** Stage A: directed chord-to-chord move. `from` null at the opening. */
  transitionCost(from: VocabChord | null, to: VocabChord): number;
  /** Stage A: chord change landing on this metric position. */
  harmonicRhythmCost(changeAt: MetricStrength): number;
  /** Stage A: ti-bearing chords under a gapped (ti-less) melody. */
  gappedMelodyCost(chord: VocabChord, melodyUsesLeadingTone: boolean): number;
  /** Stage A final position: negative = bonus. */
  cadenceCost(intent: PhraseIntent, cadence: CadenceType | null): number;
  /** Stage B: weight of one voice-leading observation. 0 = observation only. */
  voiceLeadingCost(factId: VoiceLeadingFactId): number;
  /** Stage B: per-semitone motion cost and common-tone reward. */
  smoothness: { semitoneCost: number; commonToneBonus: number };
}

/** Prevalence-derived base cost of landing on a chord (lower = more common). */
function prevalenceCost(rootDegree: number, isSeventh: boolean): number {
  const byDegree: Record<number, number> = {
    1: 0,
    5: 0.2,
    4: 0.5,
    2: 0.65,
    7: 0.9,
    6: 0.85,
    3: 1.5,
  };
  return (byDegree[rootDegree] ?? 1.2) + (isSeventh ? 0.1 : 0);
}

/** Directed progression-class adjustment (the McHose table, compressed). */
function progressionCost(from: VocabChord, to: VocabChord): number {
  if (from.rootDegree === to.rootDegree) return 0.45; // repetition — mild
  const fromD = from.rootDegree;
  const toD = to.rootDegree;
  // Normal progressions: the functional cycle plus root motion by falling
  // fifth (2→5, 5→1, 6→2, 3→6, 4→1) and the standard predominant moves.
  const normal =
    (toD - fromD + 7) % 7 === 3 || // falling fifth (ii→V, V→I, vi→ii, iii→vi, IV→I…)
    fromD === 1 || // tonic goes anywhere
    (fromD === 4 && toD === 5) ||
    (fromD === 6 && (toD === 4 || toD === 5)) ||
    (fromD === 2 && toD === 7) ||
    (fromD === 7 && toD === 1) || // leading-tone chord resolves home
    (fromD === 5 && toD === 6); // deceptive motion
  if (normal) return 0;
  // Retrogressions hymns still allow, at a price.
  if (fromD === 5 && toD === 4) return 1.5;
  return 0.8;
}

export const DEFAULT_STYLE_PACK: StylePack = {
  id: 'hymnal-default',
  version: '1.0.0',
  emissionCost(role) {
    if (role === 'root' || role === 'third') return 0;
    if (role === 'fifth') return 0.2;
    return 0.25; // seventh — fine, slightly marked
  },
  transitionCost(from, to) {
    const base = prevalenceCost(to.rootDegree, to.isSeventh);
    if (!from) return base;
    return base + progressionCost(from, to);
  },
  harmonicRhythmCost(changeAt) {
    if (changeAt === 'strong') return 0;
    if (changeAt === 'medium') return 0.1;
    return 0.5; // changing chords on a weak sixteenth is busy for a congregation
  },
  gappedMelodyCost(chord, melodyUsesLeadingTone) {
    // Pentatonic/gapped tunes (no ti in the melody) lean away from ti-bearing
    // chords — weighted, never filtered.
    return !melodyUsesLeadingTone && chord.containsLeadingTone ? 0.6 : 0;
  },
  cadenceCost(intent, cadence) {
    if (!cadence) return intent === 'close' ? 1 : 0;
    const base: Record<CadenceType, number> = {
      authentic: -0.8,
      half: -0.3,
      plagal: -0.2,
      deceptive: -0.1,
    };
    const byIntent: Record<PhraseIntent, Partial<Record<CadenceType, number>>> = {
      close: { authentic: -1.2, plagal: -0.4, half: 0.6, deceptive: 0.4 },
      approach_cadence: { half: -0.8, authentic: -0.4 },
      build: { half: -0.5, authentic: 0.2 },
      continue: { authentic: 0.3, half: -0.2 },
    };
    return base[cadence] + (byIntent[intent][cadence] ?? 0);
  },
  voiceLeadingCost(factId) {
    const costs: Partial<Record<VoiceLeadingFactId, number>> = {
      // The old books use parallels and open sounds freely — stylistic, cheap.
      parallel_perfect_fifths: 0.4,
      parallel_octaves: 0.6,
      hidden_fifth_outer: 0.2,
      hidden_octave_outer: 0.3,
      voice_crossing: 0.8,
      voice_overlap: 0.4,
      spacing_sa_exceeded: 0.7,
      spacing_at_exceeded: 0.7,
      range_outer_warning: 0.3,
      range_exceeded: 2,
      doubled_leading_tone: 1.5,
      leading_tone_unresolved: 1,
      seventh_unresolved: 1,
    };
    return costs[factId] ?? 0;
  },
  smoothness: { semitoneCost: 0.06, commonToneBonus: 0.15 },
};
