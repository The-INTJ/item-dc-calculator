/**
 * The seam-aware classification window for a non-chord melody note — builds
 * the PlacedNote neighborhood (reaching across the approach seam for the
 * first note's preparation, the approach hook cashed), hands it to the NCT
 * cascade, and stamps seam evidence on suspensions/retardations whose
 * preparation was sung at the end of the previous piece.
 */

import type { MelodyInterpretation } from '../../analysis-types';
import type { MelodyEvent } from '../../music-types';
import { metricStrengthAt, toTimelineSpan } from '../../timing';
import { makeEvidence } from '../evidence';
import { classifyNonChordTone, type PlacedNote } from '../nct';
import type { MelodyPassContext, PlacedMelodyEvent } from './melody-interpretation';

/** A neighboring melody event placed on the 0-based unit timeline. */
function placedFromEvent(event: MelodyEvent): PlacedNote {
  const span = toTimelineSpan(event.start, event.duration);
  return {
    pitch: event.pitch,
    startUnit: span.startUnit - 1,
    units: span.spanUnits,
    eventId: event.id,
  };
}

/** Classify a non-member note with the full window and report it. */
export function classifyWindowedNct(
  pass: MelodyPassContext,
  placed: PlacedMelodyEvent,
): MelodyInterpretation {
  const { event, index, startUnit, spanUnits, segmentIndex, idSeed } = placed;
  const { segments, approachSoprano, approachReading } = pass;
  const segment = segments[segmentIndex];
  const harmony = pass.harmonyEvents[segmentIndex];
  const previousEvent = pass.events[index - 1] ?? null;
  const nextEvent = pass.events[index + 1] ?? null;
  const prev: PlacedNote | null = previousEvent
    ? placedFromEvent(previousEvent)
    : approachSoprano
      ? {
          pitch: approachSoprano.pitch,
          startUnit: startUnit - 4,
          units: 4,
          eventId: 'approach:soprano',
        }
      : null;
  const next: PlacedNote | null = nextEvent ? placedFromEvent(nextEvent) : null;
  const prevChord =
    segmentIndex > 0 ? segments[segmentIndex - 1].reading : approachReading;
  const nextChord =
    segmentIndex < segments.length - 1 ? segments[segmentIndex + 1].reading : null;

  const classification = classifyNonChordTone(
    {
      voice: 'soprano',
      prev,
      cur: { pitch: event.pitch, startUnit, units: spanUnits, eventId: event.id },
      next,
      metricStrength: event.metricStrength ?? metricStrengthAt(startUnit),
      curChord: segment.reading,
      prevChord,
      nextChord,
      bassPitch: segment.bassPitch,
    },
    idSeed,
  );
  const seamPreparation = prev?.eventId === 'approach:soprano';
  if (seamPreparation && (classification.role === 'suspension' || classification.role === 'retardation')) {
    classification.evidence.push(
      makeEvidence(
        `${idSeed}-seam`,
        'approach_seam',
        true,
        'The preparation is the note this voice sang at the end of the previous piece.',
      ),
    );
  }
  return {
    melodyEventId: event.id,
    harmonyEventIds: [harmony.id],
    role: classification.role,
    ...(classification.suspensionType
      ? { suspensionType: classification.suspensionType }
      : {}),
    ...(prev?.eventId ? { preparationEventId: prev.eventId } : {}),
    ...(next?.eventId ? { resolutionEventId: next.eventId } : {}),
    explanation: classification.evidence[0]?.explanation ?? '',
    evidence: classification.evidence,
  };
}
