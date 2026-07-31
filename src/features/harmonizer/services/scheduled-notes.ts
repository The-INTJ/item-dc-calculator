/**
 * Event-to-tone mapping: turning voice/melody events into `ScheduledNote`s
 * (0-based unit offsets + per-voice velocity) ready for an instrument engine.
 */

import type { VoiceEvent } from '../domain/music-types';
import type { VoiceId } from '../domain/music-types';
import { toTimelineSpan } from '../domain/timing';

export interface ScheduledNote {
  midi: number;
  /** 0-based units from fragment start. */
  startUnit0: number;
  spanUnits: number;
  /** 0–1; per-voice balance (see VOICE_VELOCITY). */
  velocity: number;
}

/**
 * Per-voice balance: inner voices tucked (they cause most mid-band
 * roughness), bass forward (the ear is less sensitive down there), melody
 * slightly forward. Tone velocity is 0–1; smplr maps to 0–127.
 */
export const VOICE_VELOCITY: Record<VoiceId, number> = {
  soprano: 0.8,
  alto: 0.65,
  tenor: 0.65,
  bass: 0.9,
};

export function toNote(
  event: {
    pitch: { midi: number };
    start: VoiceEvent['start'];
    duration: VoiceEvent['duration'];
  },
  velocity: number,
): ScheduledNote {
  const span = toTimelineSpan(event.start, event.duration);
  return {
    midi: event.pitch.midi,
    startUnit0: span.startUnit - 1,
    spanUnits: span.spanUnits,
    velocity,
  };
}

export function startUnits(
  events: Array<{ start: VoiceEvent['start']; duration: VoiceEvent['duration'] }>,
): number[] {
  return events.map((event) => toTimelineSpan(event.start, event.duration).startUnit);
}
