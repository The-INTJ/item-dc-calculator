/**
 * Musical-time arithmetic for the workbench timeline.
 *
 * Time resolution: 1 unit = one sixteenth note. Every time-aligned lane lays
 * out on a CSS grid of `totalUnits` columns, and events place themselves with
 * the 1-based spans computed here. The POC meter is fixed 4/4 (spec §4.1);
 * these constants are the single place that assumption lives.
 */

import type { MelodyFragment, MusicalTime, RationalDuration } from './music-types';

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
