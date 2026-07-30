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

import type { ChordQuality, SpelledPitch, SpelledPitchClass, VoiceId } from '../music-types';
import { spelledInterval } from './tonal-bridge';

export interface SonorityTemplate {
  intervals: number[];
  quality: ChordQuality;
  /** Chord-symbol suffix (Cm7, G7, Fdim…). */
  suffix: string;
  /** Roman-numeral suffix (V7, ii7, vii°7…). */
  numeralSuffix: string;
  lowercaseNumeral: boolean;
}

/** Every full shape the namer recognizes, checked with each sounding pc as root. */
export const SONORITY_TEMPLATES: SonorityTemplate[] = [
  { intervals: [0, 4, 7], quality: 'major', suffix: '', numeralSuffix: '', lowercaseNumeral: false },
  { intervals: [0, 3, 7], quality: 'minor', suffix: 'm', numeralSuffix: '', lowercaseNumeral: true },
  { intervals: [0, 3, 6], quality: 'diminished', suffix: 'dim', numeralSuffix: '°', lowercaseNumeral: true },
  { intervals: [0, 4, 8], quality: 'augmented', suffix: 'aug', numeralSuffix: '+', lowercaseNumeral: false },
  { intervals: [0, 4, 7, 10], quality: 'dominant_seventh', suffix: '7', numeralSuffix: '7', lowercaseNumeral: false },
  { intervals: [0, 4, 7, 11], quality: 'major_seventh', suffix: 'maj7', numeralSuffix: 'maj7', lowercaseNumeral: false },
  { intervals: [0, 3, 7, 10], quality: 'minor_seventh', suffix: 'm7', numeralSuffix: '7', lowercaseNumeral: true },
  { intervals: [0, 3, 6, 10], quality: 'half_diminished_seventh', suffix: 'ø7', numeralSuffix: 'ø7', lowercaseNumeral: true },
  { intervals: [0, 3, 6, 9], quality: 'fully_diminished_seventh', suffix: '°7', numeralSuffix: '°7', lowercaseNumeral: true },
  { intervals: [0, 5, 7], quality: 'suspended_fourth', suffix: 'sus4', numeralSuffix: 'sus4', lowercaseNumeral: false },
  { intervals: [0, 2, 7], quality: 'suspended_second', suffix: 'sus2', numeralSuffix: 'sus2', lowercaseNumeral: false },
];

export function templateForQuality(quality: ChordQuality): SonorityTemplate | null {
  return SONORITY_TEMPLATES.find((template) => template.quality === quality) ?? null;
}

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

function toPc(pitch: SpelledPitch): SpelledPitchClass {
  return { letter: pitch.letter, accidental: pitch.accidental, pitchClass: pitch.pitchClass };
}

/** Distinct pitch classes in low-to-high first-appearance order, with spellings. */
function distinctTones(pitches: SpelledPitch[]): SpelledPitchClass[] {
  const tones: SpelledPitchClass[] = [];
  for (const pitch of pitches) {
    if (!tones.some((tone) => tone.pitchClass === pitch.pitchClass)) tones.push(toPc(pitch));
  }
  return tones;
}

/** Exact template match over a pc set; roots tried in the given order. */
function exactMatch(
  pcs: number[],
  rootOrder: number[],
): { rootPc: number; template: SonorityTemplate } | null {
  for (const rootPc of rootOrder) {
    const relative = new Set(pcs.map((pc) => (pc - rootPc + 12) % 12));
    for (const template of SONORITY_TEMPLATES) {
      if (
        relative.size === template.intervals.length &&
        template.intervals.every((interval) => relative.has(interval))
      ) {
        return { rootPc, template };
      }
    }
  }
  return null;
}

function rootOrderFor(pcs: number[], bassPc: number): number[] {
  return [bassPc, ...pcs.filter((pc) => pc !== bassPc)];
}

/** Chord tones stacked from the root, spelled from the sounding instances. */
function stackedTones(
  tones: SpelledPitchClass[],
  rootPc: number,
  template: SonorityTemplate,
): SpelledPitchClass[] {
  return template.intervals
    .map((interval) => tones.find((tone) => tone.pitchClass === (rootPc + interval) % 12))
    .filter((tone): tone is SpelledPitchClass => tone !== undefined);
}

function readDyad(pitches: SpelledPitch[], tones: SpelledPitchClass[]): SonorityReading {
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

function readSubset(input: IdentifySonorityInput, tones: SpelledPitchClass[]): SonorityReading {
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
  return readSubset(input, tones);
}
