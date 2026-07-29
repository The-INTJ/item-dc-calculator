/**
 * Signature strings used to match workbench input against authored fixtures
 * (spec §17.1). A fixture's stored match values must equal the signatures
 * computed from its own initial state — enforced by fixtures/registry.test.ts.
 */

import type {
  BoundaryConstraint,
  HarmonyEvent,
  MelodyEvent,
  RationalDuration,
} from './music-types';
import { durationToUnits } from './timing';

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

/** e.g. "sol4:q|fa4:q|mi4:h" */
export function melodySignature(events: MelodyEvent[]): string {
  return events
    .map((event) => `${event.scaleDegree.syllable}${event.pitch.octave}:${durationToCode(event.duration)}`)
    .join('|');
}

/** e.g. "hold|allowed" — policies in melody order. */
export function boundarySignature(constraints: BoundaryConstraint[]): string {
  return constraints.map((constraint) => constraint.policy).join('|');
}

const INVERSION_CODES = ['root', 'first', 'second', 'third'] as const;

/** e.g. "I:root"; "none" when the fragment opens the piece. */
export function acceptedHarmonySignature(harmony: HarmonyEvent | null): string {
  if (!harmony) return 'none';
  return `${harmony.analysis.romanNumeral}:${INVERSION_CODES[harmony.inversion]}`;
}
