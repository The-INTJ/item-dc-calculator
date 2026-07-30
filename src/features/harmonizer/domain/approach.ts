/**
 * The approach: what a snippet is arriving FROM.
 *
 * Once a hymn is composed snippet by snippet, a snippet in the middle cannot be
 * read in isolation. Plenty of first chords look like nothing on their own, but
 * with the chord (and the note each voice held) immediately before them, a
 * passing tone becomes obvious. So the seam is carried as data, not redrawn as
 * decoration: `AcceptedContext.previousVoicing` records the notes the previous
 * snippet ended on, and every candidate gets stamped with an `approach` so the
 * voice lanes, the chord strip, and the suggestion cards all describe the same
 * thing.
 *
 * THIS IS THE HOOK FOR THE REAL ANALYSIS. When the math and data land, a
 * non-chord-tone classifier reads `approach.voices[voice].pitch` to decide
 * whether the snippet's first note is a passing tone, a suspension resolving
 * across the seam, and so on. Nothing here makes that judgment yet — it only
 * guarantees the information is present and honest.
 */

import type { CandidatePath } from './analysis-types';
import type {
  HarmonyEvent,
  SATBVoicing,
  ScaleDegreePitch,
  SpelledPitch,
  VoiceEvent,
  VoiceId,
} from './music-types';
import { toTimelineSpan } from './timing';
import type { AcceptedContext } from './workbench-state';

const VOICES: VoiceId[] = ['soprano', 'alto', 'tenor', 'bass'];

/** The note one voice arrives from. */
export interface ApproachVoice {
  pitch: SpelledPitch;
  scaleDegree: ScaleDegreePitch;
}

export interface ApproachContext {
  /** The chord the previous snippet ended on (measure-0 convention), if known. */
  harmony: HarmonyEvent | null;
  /** Per voice, the last note that sounded before this snippet. */
  voices: Partial<Record<VoiceId, ApproachVoice>>;
}

/** The last event a voice sounded, by timeline position (not array order). */
export function lastSounding(voicing: SATBVoicing, voice: VoiceId): VoiceEvent | null {
  let latest: VoiceEvent | null = null;
  let latestStart = -1;
  for (const event of voicing[voice]) {
    const start = toTimelineSpan(event.start, event.duration).startUnit;
    if (start > latestStart) {
      latestStart = start;
      latest = event;
    }
  }
  return latest;
}

/**
 * What the accepted context says we are coming from. Null when the snippet
 * opens the piece — nothing to show and nothing to reason about.
 */
export function approachFromAccepted(accepted: AcceptedContext): ApproachContext | null {
  const voices: Partial<Record<VoiceId, ApproachVoice>> = {};
  if (accepted.previousVoicing) {
    for (const voice of VOICES) {
      const event = lastSounding(accepted.previousVoicing, voice);
      if (event) voices[voice] = { pitch: event.pitch, scaleDegree: event.scaleDegree };
    }
  }
  const harmony = accepted.previousHarmony;
  if (!harmony && Object.keys(voices).length === 0) return null;
  return { harmony, voices };
}

/**
 * Stamp every candidate with the seam it is being read against. Only the
 * `approach` field changes — notes are never touched, so this is safe to apply
 * to the working reading as well (the surface rule holds).
 */
export function stampApproach(
  candidates: readonly CandidatePath[],
  accepted: AcceptedContext,
): CandidatePath[] {
  const approach = approachFromAccepted(accepted);
  return candidates.map((candidate) => {
    if (!approach) {
      if (!candidate.approach) return candidate;
      const { approach: _dropped, ...rest } = candidate;
      return rest;
    }
    return { ...candidate, approach };
  });
}

/** The voicing an applied snippet leaves behind for whatever follows it. */
export function trailingVoicing(candidate: CandidatePath): SATBVoicing {
  return candidate.voicing;
}
