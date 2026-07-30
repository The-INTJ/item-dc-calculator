/**
 * Musical-time arithmetic for the workbench timeline.
 *
 * Time resolution: 1 unit = one sixteenth note. Every time-aligned lane lays
 * out on a CSS grid of `totalUnits` columns, and events place themselves with
 * the 1-based spans computed here. The POC meter is fixed 4/4 (spec §4.1);
 * these constants are the single place that assumption lives.
 */

import type { MelodyFragment, MusicalTime, RationalDuration, SATBVoicing } from './music-types';

/** 1 unit = one sixteenth note. */
export const UNITS_PER_WHOLE_NOTE = 16;
/** POC meter is fixed 4/4 (spec §4.1). */
export const BEATS_PER_MEASURE = 4;
export const UNITS_PER_BEAT = UNITS_PER_WHOLE_NOTE / 4;

export interface TimelineSpan {
  /** 1-based unit index at which the event starts within the fragment. */
  startUnit: number;
  spanUnits: number;
}

export function durationToUnits(duration: RationalDuration): number {
  return (duration.numerator / duration.denominator) * UNITS_PER_WHOLE_NOTE;
}

/**
 * 0-based absolute units from measure 1, beat 1. Measure 0 is the notional
 * accepted-context measure and yields negative values by design.
 */
export function timeToUnits(time: MusicalTime): number {
  return (
    (time.measure - 1) * BEATS_PER_MEASURE * UNITS_PER_BEAT +
    (time.beat - 1) * UNITS_PER_BEAT +
    time.subdivision
  );
}

export function toTimelineSpan(start: MusicalTime, duration: RationalDuration): TimelineSpan {
  return {
    startUnit: timeToUnits(start) + 1,
    spanUnits: durationToUnits(duration),
  };
}

/** Total sixteenth units the fragment's melody occupies (16 for one 4/4 measure). */
export function totalUnits(fragment: MelodyFragment): number {
  return fragment.events.reduce((total, event) => {
    const span = toTimelineSpan(event.start, event.duration);
    return Math.max(total, span.startUnit - 1 + span.spanUnits);
  }, 0);
}

/** Inverse of timeToUnits: 0-based absolute units → musical time. */
export function unitsToTime(absoluteUnits: number): MusicalTime {
  const unitsPerMeasure = BEATS_PER_MEASURE * UNITS_PER_BEAT;
  const measure = Math.floor(absoluteUnits / unitsPerMeasure) + 1;
  const remainder = ((absoluteUnits % unitsPerMeasure) + unitsPerMeasure) % unitsPerMeasure;
  return {
    measure,
    beat: Math.floor(remainder / UNITS_PER_BEAT) + 1,
    subdivision: remainder % UNITS_PER_BEAT,
  };
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

/** Sixteenth units → reduced rational duration (8 → 1/2, 6 → 3/8). */
export function unitsToDuration(units: number): RationalDuration {
  const divisor = greatestCommonDivisor(units, UNITS_PER_WHOLE_NOTE);
  return { numerator: units / divisor, denominator: UNITS_PER_WHOLE_NOTE / divisor };
}

/** Furthest end unit across all four voices (0 when empty). */
export function voicingUnits(voicing: SATBVoicing): number {
  let max = 0;
  for (const events of [voicing.soprano, voicing.alto, voicing.tenor, voicing.bass]) {
    for (const event of events) {
      const span = toTimelineSpan(event.start, event.duration);
      max = Math.max(max, span.startUnit - 1 + span.spanUnits);
    }
  }
  return max;
}

export type MetricStrength = 'strong' | 'medium' | 'weak';

/**
 * Metric weight of a 0-based unit position in the fixed 4/4 meter: beat 1 is
 * strong, beat 3 medium, everything else (beats 2/4 and off-beat sixteenths)
 * weak. The engine's segmentation and non-chord-tone rules read this.
 */
export function metricStrengthAt(absoluteUnit: number): MetricStrength {
  const unitsPerMeasure = BEATS_PER_MEASURE * UNITS_PER_BEAT;
  const inMeasure = ((absoluteUnit % unitsPerMeasure) + unitsPerMeasure) % unitsPerMeasure;
  if (inMeasure === 0) return 'strong';
  if (inMeasure === 2 * UNITS_PER_BEAT) return 'medium';
  return 'weak';
}

/** "beat 1" for a quarter on beat 1; "beats 3–4" for a half on beat 3. */
export function formatBeatRange(start: MusicalTime, duration: RationalDuration): string {
  const beatsSpanned = durationToUnits(duration) / UNITS_PER_BEAT;
  if (beatsSpanned <= 1) return `beat ${start.beat}`;
  const lastBeat = start.beat + Math.ceil(beatsSpanned) - 1;
  return `beats ${start.beat}–${lastBeat}`;
}

/** Convert timeline units to seconds at a tempo (quarter note = one beat). */
export function unitsToSeconds(units: number, tempoBpm: number): number {
  const secondsPerBeat = 60 / tempoBpm;
  return (units / UNITS_PER_BEAT) * secondsPerBeat;
}
