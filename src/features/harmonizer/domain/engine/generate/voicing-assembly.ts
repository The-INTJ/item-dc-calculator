/* ---------------- SATB lane assembly ---------------- */

import type { MelodyFragment, SpelledPitch, TonalContext, VoiceEvent } from '../../music-types';
import { respellDegree } from '../../scale';
import { toTimelineSpan, unitsToDuration, unitsToTime } from '../../timing';
import type { Assignment, ChordSegment } from './assignments';
import type { PathStep } from './path-steps';

export interface AssembledVoicing {
  soprano: VoiceEvent[];
  alto: VoiceEvent[];
  tenor: VoiceEvent[];
  bass: VoiceEvent[];
}

// Contiguous same-pitch events merge into one held note — a congregation
// does not re-articulate a common tone, and a pinned whole note that spans
// several segments stays ONE note (lock badges re-map onto it verbatim).
function mergeHeldNotes(lane: VoiceEvent[]): VoiceEvent[] {
  const sorted = [...lane].sort(
    (a, b) =>
      toTimelineSpan(a.start, a.duration).startUnit - toTimelineSpan(b.start, b.duration).startUnit,
  );
  const merged: VoiceEvent[] = [];
  for (const event of sorted) {
    const previous = merged[merged.length - 1];
    if (previous) {
      const previousSpan = toTimelineSpan(previous.start, previous.duration);
      const span = toTimelineSpan(event.start, event.duration);
      if (
        previousSpan.startUnit + previousSpan.spanUnits === span.startUnit &&
        previous.pitch.midi === event.pitch.midi
      ) {
        merged[merged.length - 1] = {
          ...previous,
          duration: unitsToDuration(previousSpan.spanUnits + span.spanUnits),
        };
        continue;
      }
    }
    merged.push(event);
  }
  return merged;
}

/** Assemble the SATB voicing: soprano from the melody, lower lanes from the winning assignments. */
export function assembleVoicing(
  id: string,
  fragment: MelodyFragment,
  context: TonalContext,
  segments: ChordSegment[],
  chordSegments: ChordSegment[],
  assignments: Assignment[],
): AssembledVoicing {
  const soprano: VoiceEvent[] = fragment.events.map((event, i) => ({
    id: `${id}-s${i}`,
    voice: 'soprano',
    pitch: event.pitch,
    scaleDegree: respellDegree(context, event.pitch) ?? event.scaleDegree,
    start: event.start,
    duration: event.duration,
    tieFromPrevious: event.tieFromPrevious,
  }));
  const alto: VoiceEvent[] = [];
  const tenor: VoiceEvent[] = [];
  const bass: VoiceEvent[] = [];
  const lanes = { alto, tenor, bass };
  chordSegments.forEach((segment, segmentIndex) => {
    const assignment = assignments[segmentIndex];
    const make = (voice: 'alto' | 'tenor' | 'bass', pitch: SpelledPitch): VoiceEvent => ({
      id: `${id}-seg${segmentIndex}-${voice}`,
      voice,
      pitch,
      scaleDegree: respellDegree(context, pitch) ?? {
        degree: 1,
        chromaticOffset: 0,
        syllable: 'do',
      },
      start: unitsToTime(segment.startUnit),
      duration: unitsToDuration(segment.units),
      tieFromPrevious: false,
    });
    alto.push(make('alto', assignment.alto));
    tenor.push(make('tenor', assignment.tenor));
    bass.push(make('bass', assignment.bass));
  });
  // Pinned notes render verbatim inside hole spans (their lanes stay honest).
  const holeSegments = segments.filter((segment) => segment.step.kind === 'unresolved');
  for (const hole of holeSegments) {
    const step = hole.step as Extract<PathStep, { kind: 'unresolved' }>;
    step.locks.forEach((lock, lockIndex) => {
      if (lock.voice === 'soprano') return;
      // Clip the pinned note to this hole's span; adjacent clips of the same
      // sustained note merge back into one below.
      const clipStart = Math.max(lock.startUnit, hole.startUnit);
      const clipEnd = Math.min(lock.startUnit + lock.units, hole.startUnit + hole.units);
      if (clipEnd <= clipStart) return;
      lanes[lock.voice].push({
        id: `${id}-locked-${hole.eventIndex}-${lockIndex}`,
        voice: lock.voice,
        pitch: lock.pitch,
        scaleDegree:
          lock.scaleDegree ??
          respellDegree(context, lock.pitch) ?? {
            degree: 1,
            chromaticOffset: 0,
            syllable: 'do',
          },
        start: unitsToTime(clipStart),
        duration: unitsToDuration(clipEnd - clipStart),
        tieFromPrevious: false,
      });
    });
  }
  return {
    soprano,
    alto: mergeHeldNotes(alto),
    tenor: mergeHeldNotes(tenor),
    bass: mergeHeldNotes(bass),
  };
}
