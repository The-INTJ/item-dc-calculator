/**
 * Melody interpretation — one reading per melody event against the harmony
 * events covering it: chord tones (including the sustained-note suspension
 * shape when a held note outlives its chord), honest unknowns when no chord
 * identity exists, and classified non-chord tones via the seam-aware window
 * in nct-window.ts.
 */

import type { MelodyInterpretation } from '../../analysis-types';
import type { ApproachContext, ApproachVoice } from '../../approach';
import type { HarmonyEvent, MelodyEvent, MelodyFragment } from '../../music-types';
import { toTimelineSpan } from '../../timing';
import { templateForQuality, type SonorityReading } from '../chord-id';
import { makeEvidence } from '../evidence';
import { memberOfReading } from '../nct';
import type { AnalyzedSegment } from '../segmentation';
import { classifyWindowedNct } from './nct-window';

/** Reconstruct a reading from a stored chord (the approach seam's harmony). */
function readingFromStoredChord(harmony: HarmonyEvent): SonorityReading | null {
  const template = templateForQuality(harmony.chord.quality);
  if (!template) return null;
  return {
    kind: 'exact',
    root: harmony.chord.root,
    quality: harmony.chord.quality,
    template,
    tones: harmony.chord.spelledChordTones,
  };
}

/** Everything one melody pass reads: the surface, its analysis, the seam. */
export interface MelodyPassContext {
  events: MelodyEvent[];
  segments: AnalyzedSegment[];
  harmonyEvents: HarmonyEvent[];
  approachReading: SonorityReading | null;
  approachSoprano: ApproachVoice | null;
  idPrefix: string;
}

/** A melody event located on the unit timeline and in the segment list. */
export interface PlacedMelodyEvent {
  event: MelodyEvent;
  index: number;
  startUnit: number;
  spanUnits: number;
  segmentIndex: number;
  idSeed: string;
}

/** A chord-tone note — including the sustained shape that outlives its chord. */
function interpretMemberNote(
  pass: MelodyPassContext,
  placed: PlacedMelodyEvent,
): MelodyInterpretation {
  const { event, index, startUnit, spanUnits, idSeed } = placed;
  const { segments, harmonyEvents } = pass;
  const harmony = harmonyEvents[placed.segmentIndex];
  // A sustained note can outlive its chord: member at its start, but a
  // non-member of a LATER covering segment — the suspension shape (fixture
  // B's held do over the arriving V). Check every segment the note spans.
  const noteEnd = startUnit + spanUnits;
  const laterCovering = segments
    .map((candidate, i) => ({ candidate, i }))
    .filter(
      ({ candidate }) =>
        candidate.start > startUnit && candidate.start < noteEnd,
    );
  const clashing = laterCovering.find(
    ({ candidate }) => memberOfReading(event.pitch, candidate.reading) === false,
  );
  if (clashing) {
    const nextEvent = pass.events[index + 1] ?? null;
    const clashHarmony = harmonyEvents[clashing.i];
    const stepsDownToMember =
      nextEvent !== null &&
      event.pitch.midi - nextEvent.pitch.midi >= 1 &&
      event.pitch.midi - nextEvent.pitch.midi <= 2 &&
      memberOfReading(nextEvent.pitch, clashing.candidate.reading) === true;
    if (stepsDownToMember) {
      const figure = clashing.candidate.suspensionFigure ?? 'other';
      const entry = makeEvidence(
        idSeed,
        'nct_suspension',
        figure,
        'Held over from the previous chord, clashing as the harmony moves on, then falling by step onto a chord tone.',
      );
      return {
        melodyEventId: event.id,
        harmonyEventIds: [harmony.id, clashHarmony.id],
        role: 'suspension',
        suspensionType: figure,
        ...(nextEvent ? { resolutionEventId: nextEvent.id } : {}),
        explanation: entry.explanation ?? '',
        evidence: [entry],
      };
    }
    const entry = makeEvidence(
      idSeed,
      'nct_ambiguous',
      false,
      'Held while the harmony moves on, without a clean step-down resolution — open to interpretation.',
    );
    return {
      melodyEventId: event.id,
      harmonyEventIds: [harmony.id, clashHarmony.id],
      role: 'ambiguous',
      explanation: entry.explanation ?? '',
      evidence: [entry],
    };
  }
  const entry = makeEvidence(
    idSeed,
    'nct_chord_tone',
    true,
    `${event.pitch.letter} is a tone of the ${harmony.displaySymbol} sounding here.`,
  );
  return {
    melodyEventId: event.id,
    harmonyEventIds: [harmony.id],
    role: 'chord_tone',
    explanation: entry.explanation ?? '',
    evidence: [entry],
  };
}

/** Locate one melody event and dispatch to the reading that fits it. */
function interpretEvent(
  pass: MelodyPassContext,
  event: MelodyEvent,
  index: number,
): MelodyInterpretation {
  const span = toTimelineSpan(event.start, event.duration);
  const startUnit = span.startUnit - 1;
  const segmentIndex = pass.segments.findIndex(
    (segment) => segment.start <= startUnit && startUnit < segment.start + segment.units,
  );
  const segment = segmentIndex === -1 ? null : pass.segments[segmentIndex];
  const harmony = segmentIndex === -1 ? null : pass.harmonyEvents[segmentIndex];
  const idSeed = `${pass.idPrefix}-int-${index}`;

  if (!segment || !harmony) {
    const entry = makeEvidence(
      idSeed,
      'chord_unknown',
      false,
      'No harmony covers this span yet.',
    );
    return {
      melodyEventId: event.id,
      harmonyEventIds: [],
      role: 'unclassified',
      explanation: entry.explanation ?? '',
      evidence: [entry],
    };
  }

  const member = memberOfReading(event.pitch, segment.reading);
  if (member === null) {
    const entry = makeEvidence(
      idSeed,
      'chord_unknown',
      false,
      'The notes sounding here form no chord to measure this note against — shown as it sounds.',
    );
    return {
      melodyEventId: event.id,
      harmonyEventIds: [harmony.id],
      role: 'unclassified',
      explanation: entry.explanation ?? '',
      evidence: [entry],
    };
  }

  const placed: PlacedMelodyEvent = {
    event,
    index,
    startUnit,
    spanUnits: span.spanUnits,
    segmentIndex,
    idSeed,
  };

  if (member) return interpretMemberNote(pass, placed);

  // Not a chord tone — classify with the full window, reaching across the
  // seam for the first note's preparation (the approach hook, cashed).
  return classifyWindowedNct(pass, placed);
}

/** Melody interpretations for the fragment, seam-aware via the approach. */
export function interpretMelody(
  fragment: MelodyFragment,
  segments: AnalyzedSegment[],
  harmonyEvents: HarmonyEvent[],
  approach: ApproachContext | null,
  idPrefix: string,
): MelodyInterpretation[] {
  const approachReading = approach?.harmony ? readingFromStoredChord(approach.harmony) : null;
  const approachSoprano = approach?.voices.soprano ?? null;
  const pass: MelodyPassContext = {
    events: fragment.events,
    segments,
    harmonyEvents,
    approachReading,
    approachSoprano,
    idPrefix,
  };
  return fragment.events.map((event, index) => interpretEvent(pass, event, index));
}
