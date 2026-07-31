/**
 * Signature strings used to match workbench input against authored fixtures
 * (spec §17.1). A fixture's stored match values must equal the signatures
 * computed from its own initial state — enforced by fixtures/registry.test.ts.
 *
 * Rests are encoded as `r:<code>` tokens so melodies with gaps (delete-created
 * or authored) never false-match contiguous fixtures. Gapless melodies produce
 * exactly the historical format (e.g. "sol4:q|fa4:q|mi4:h").
 */

import type { HarmonyEvent, MelodyEvent, RationalDuration } from './music-types';
import { durationToUnits, toTimelineSpan, unitsToDuration } from './timing';

const DURATION_CODES: Record<number, string> = {
  16: 'w',
  8: 'h',
  4: 'q',
  2: 'e',
  1: 's',
};

export function durationToCode(duration: RationalDuration): string {
  const code = DURATION_CODES[durationToUnits(duration)] as string | undefined;
  return code ?? `${duration.numerator}/${duration.denominator}`;
}

/**
 * e.g. "sol4:q|fa4:q|mi4:h"; with a gap: "sol4:q|r:q|mi4:h".
 *
 * Silence reads as "r" however it arose — an empty stretch between notes, or a
 * note that has been silenced. The signature describes the music, and those two
 * sound exactly alike, so a silenced note must not sign as the note it is
 * remembering.
 */
export function melodySignature(events: MelodyEvent[]): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const event of events) {
    const span = toTimelineSpan(event.start, event.duration);
    const start = span.startUnit - 1;
    if (start > cursor) {
      parts.push(`r:${durationToCode(unitsToDuration(start - cursor))}`);
    }
    parts.push(
      event.isRest
        ? `r:${durationToCode(event.duration)}`
        : `${event.scaleDegree.syllable}${event.pitch.octave}:${durationToCode(event.duration)}`,
    );
    cursor = start + span.spanUnits;
  }
  return parts.join('|');
}

const INVERSION_CODES = ['root', 'first', 'second', 'third'] as const;

/** e.g. "I:root"; "none" when the fragment opens the piece. */
export function acceptedHarmonySignature(harmony: HarmonyEvent | null): string {
  if (!harmony) return 'none';
  return `${harmony.analysis.romanNumeral}:${INVERSION_CODES[harmony.inversion]}`;
}
