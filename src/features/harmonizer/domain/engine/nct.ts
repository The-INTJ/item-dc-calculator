/**
 * Non-chord-tone classification — testable predicates over the window
 * (previous note, current note, next note, metric position, current chord,
 * neighboring chords), operationalized from the textbook definitions. The
 * v1 honesty contract: passing tones, neighbor tones, and suspensions are
 * SOLID; the rarer roles are claimed only on clean evidence and everything
 * else returns 'ambiguous' — the best published classifiers cap out around
 * F1 ≈ 0.72, so honest ambiguity is correctness, not a cop-out.
 *
 * This module owns the melodic primitives and the window/classification
 * types; the rule cascade itself (classifyNonChordTone) lives in
 * nct-classification.ts and is re-exported here.
 *
 * The one primitive shared with segmentation and chord-id fallbacks is
 * resolvesByStepSoon — Melisma's ornamental-dissonance rule: a sounding
 * dissonance earns its keep by moving to a step-adjacent note shortly.
 */

import type { AnalysisEvidence, MelodyRole } from '../analysis-types';
import type { SpelledPitch, VoiceId } from '../music-types';
// UNITS_PER_BEAT: the resolves-by-step horizon defaults to "one beat", which
// tracks the meter's beat note — see the meter ledger in domain/timing.ts.
import { UNITS_PER_BEAT, type MetricStrength } from '../timing';
import type { SonorityReading } from './chord-id';
import type { EngineFeatureId } from './evidence';

export { classifyNonChordTone } from './nct-classification';

export interface PlacedNote {
  pitch: SpelledPitch;
  /** 0-based unit start. */
  startUnit: number;
  units: number;
  /** Event id when the note comes from a stored event (absent for seam notes). */
  eventId?: string;
}

/** Semitone step (half or whole). Zero is not a step. */
export function isStep(from: SpelledPitch, to: SpelledPitch): boolean {
  const distance = Math.abs(to.midi - from.midi);
  return distance === 1 || distance === 2;
}

export function isLeap(from: SpelledPitch, to: SpelledPitch): boolean {
  return Math.abs(to.midi - from.midi) > 2;
}

export function direction(from: SpelledPitch, to: SpelledPitch): -1 | 0 | 1 {
  return Math.sign(to.midi - from.midi) as -1 | 0 | 1;
}

/**
 * Does this note move to a step-adjacent note in its own voice soon (within
 * `horizonUnits` after it ends)? The ornamental-dissonance rule.
 */
export function resolvesByStepSoon(
  note: PlacedNote,
  laterInVoice: PlacedNote[],
  horizonUnits: number = UNITS_PER_BEAT,
): { resolves: boolean; direction: -1 | 0 | 1 } {
  const noteEnd = note.startUnit + note.units;
  const next = laterInVoice
    .filter((candidate) => candidate.startUnit >= noteEnd)
    .sort((a, b) => a.startUnit - b.startUnit)[0];
  if (!next || next.startUnit > noteEnd + horizonUnits) {
    return { resolves: false, direction: 0 };
  }
  if (!isStep(note.pitch, next.pitch)) return { resolves: false, direction: 0 };
  return { resolves: true, direction: direction(note.pitch, next.pitch) };
}

/** Is a pitch class a tone of the reading? Null when the reading names no chord. */
export function memberOfReading(pitch: SpelledPitch, reading: SonorityReading): boolean | null {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
    case 'open_fifth':
      return reading.tones.some((tone) => tone.pitchClass === pitch.pitchClass);
    case 'monad':
      return reading.tone.pitchClass === pitch.pitchClass;
    case 'dyad':
    case 'unknown':
      return null; // no chord identity to be a non-member of
  }
}

export interface NctWindow {
  voice: VoiceId;
  /** May come from the approach seam — the note this voice arrives from. */
  prev: PlacedNote | null;
  cur: PlacedNote;
  next: PlacedNote | null;
  metricStrength: MetricStrength;
  curChord: SonorityReading;
  prevChord: SonorityReading | null;
  nextChord: SonorityReading | null;
  /** The sounding bass under the current note — suspension figures need it. */
  bassPitch: SpelledPitch;
}

export interface NctClassification {
  role: MelodyRole;
  suspensionType?: '4-3' | '7-6' | '9-8' | '2-3' | 'other';
  featureId: EngineFeatureId;
  /** Evidence prose fragments; the composer turns these into sentences. */
  evidence: AnalysisEvidence[];
}
