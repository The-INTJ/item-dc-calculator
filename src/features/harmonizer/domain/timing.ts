/**
 * Musical-time arithmetic for the workbench timeline.
 *
 * Time resolution: 1 unit = one sixteenth note. Every time-aligned lane lays
 * out on a CSS grid of `totalUnits` columns, and events place themselves with
 * the 1-based spans computed here. The POC meter is fixed 4/4 (spec §4.1);
 * these constants are the single place that assumption lives.
 *
 * ================= THE METER LEDGER (Drew, 2026-07-30) =================
 * Settings shows a Time-signature seat that is 4/4-only (ContextBar's
 * TimeSignatureSelector). Making ANY time signature real is an architectural
 * sweep, not a constant swap. Every seat listed here carries a pointer back
 * to this ledger; the sweep must consider:
 *
 * 1. REPRESENTATION — meter becomes state, not module constants: a
 *    `{ beatsPerMeasure, beatUnit }` value on TonalContext or its own
 *    workbench + persisted field (zod strictObject lockstep — an optional
 *    field keeps v2 saves parsing, see projects/project-store.ts). The `/4`
 *    in UNITS_PER_BEAT hardcodes a quarter-note beat; x/8 meters redefine
 *    the beat note, and UNITS_PER_MEASURE / TIME_SIGNATURE_LABEL become
 *    derived values.
 * 2. TIME ARITHMETIC (this file) — timeToUnits/unitsToTime assume a constant
 *    measure length (a mid-piece meter change breaks the bijection);
 *    unitsToDuration reduces against the 16-unit whole (compound meters want
 *    dotted-friendly reduction); formatBeatRange and unitsToSeconds assume
 *    quarter = one beat.
 * 3. THE ACCENT MAP — metricStrengthAt IS the 4/4 pattern (beat 1 strong,
 *    beat 3 medium). 3/4 has no medium beat; 6/8 accents beats 1 and 4. Its
 *    consumers inherit whatever it returns: engine/segmentation.ts
 *    (ornamental merging on weak slices), engine/nct.ts (one-beat resolution
 *    horizon), engine/annotate.ts (cadential six-four gating),
 *    engine/generate.ts (chord-change costs, unresolved-merge and
 *    second-inversion gates).
 * 4. THE EDITOR — the one-measure viewport floor
 *    (components/inspector/CandidateInspector.tsx gridUnits), the growth cap
 *    (state/workbenchReducer.ts measureCap; domain/voice-editing.ts
 *    DEFAULT_MAX_TOTAL_UNITS), the beat-dot cadence
 *    (components/workspace/BeatDots.tsx), the mobile pan window
 *    (components/shared/pan.ts VISIBLE_BEATS), and the CSS fallback
 *    `var(--wb-time-units, 16)` in components/shared/_time-grid.scss.
 * 5. THE SEAM — domain/next-fragment.ts opens a continuation ONE_BEAT long
 *    with a quarter-note literal; the opening length should track the meter's
 *    beat note.
 * 6. THE HYMN PROJECTION — domain/composition.ts concatenates raw units and
 *    re-times with unitsToTime; measures in different meters need
 *    barline-aware offsets (per-measure meter would live on AppliedFragment).
 * 7. PERSISTENCE + FIXTURES — MusicalTimeSchema's subdivision range and every
 *    fixture assume four subdivisions per beat; saved MusicalTime values are
 *    only meaningful against the meter they were written in.
 * 8. THE STAFF VIEW (domain/notation/) — notation carries its own reading of
 *    the meter, so a new meter is not just new arithmetic but new engraving
 *    convention. duration-notation.ts holds the accent hierarchy TWICE OVER:
 *    boundaryStrength ranks barline > mid-bar > beat > half-beat (the mid-bar
 *    rank exists because 4/4 has a secondary accent — 3/4 has none, and 6/8's
 *    falls elsewhere), and writableAsOne decides which of those a note may
 *    hide, the rule that makes a half note on beat 2 legal but the same note
 *    an eighth later illegal. decomposeRestSpan merges silence into half-bars
 *    for the same reason. staff-model.ts draws a barline every
 *    UNITS_PER_MEASURE and prints TIME_SIGNATURE_LABEL. Compound meters also
 *    want dotted values as their DEFAULT beat rather than an exception, which
 *    WRITTEN_VALUES currently treats as a special case.
 * =======================================================================
 */

import type { MelodyFragment, MusicalTime, RationalDuration, SATBVoicing } from './music-types';

/** 1 unit = one sixteenth note. */
export const UNITS_PER_WHOLE_NOTE = 16;
/** POC meter is fixed 4/4 (spec §4.1). */
export const BEATS_PER_MEASURE = 4;
export const UNITS_PER_BEAT = UNITS_PER_WHOLE_NOTE / 4;
/** Units in one full measure of the fixed 4/4 meter. */
export const UNITS_PER_MEASURE = BEATS_PER_MEASURE * UNITS_PER_BEAT;
/** The Settings seat's display string (no musical values in JSX). */
export const TIME_SIGNATURE_LABEL = '4/4';

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
    (time.measure - 1) * UNITS_PER_MEASURE +
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
  const unitsPerMeasure = UNITS_PER_MEASURE;
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
  const unitsPerMeasure = UNITS_PER_MEASURE;
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
