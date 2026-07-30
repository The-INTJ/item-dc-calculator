/**
 * The shared annotator — ONE analysis path for the user's surface and (from
 * slice 5) every generated candidate, so the cards and the workspace always
 * tell the same story. Composes segmentation → chord identity → key-relative
 * reading → melody interpretation (chord tones and classified non-chord
 * tones, seam-aware via the approach) → voice-leading facts → key sanity.
 *
 * Everything is deterministic and pure; every claim carries evidence.
 */

import type { AnalysisEvidence, MelodyInterpretation } from '../analysis-types';
import type { ApproachContext } from '../approach';
import type {
  HarmonyEvent,
  MelodyFragment,
  SATBVoicing,
  SpelledPitchClass,
  TonalContext,
} from '../music-types';
import { metricStrengthAt, toTimelineSpan, unitsToDuration, unitsToTime } from '../timing';
import { templateForQuality, type SonorityReading } from './chord-id';
import { makeEvidence } from './evidence';
import { classifyNonChordTone, memberOfReading, type PlacedNote } from './nct';
import { analyzeInKey } from './roman';
import { keySanityCheck } from './key-sanity';
import { placedVoiceLines, segmentSurface, type AnalyzedSegment } from './segmentation';
import { checkVoiceLeading } from './voice-leading';

export interface AnnotationResult {
  harmonyEvents: HarmonyEvent[];
  melodyInterpretations: MelodyInterpretation[];
  /** Candidate-level evidence: voice-leading facts, cadence readings, key sanity. */
  evidence: AnalysisEvidence[];
}

/** The chord tones a reading asserts; sounding tones when it asserts none. */
function chordTonesOf(reading: SonorityReading, segment: AnalyzedSegment): SpelledPitchClass[] {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
    case 'open_fifth':
      return reading.tones;
    case 'monad':
      return [reading.tone];
    case 'dyad':
    case 'unknown':
      return reading.tones.length > 0
        ? reading.tones
        : segment.pitches.map((pitch) => ({
            letter: pitch.letter,
            accidental: pitch.accidental,
            pitchClass: pitch.pitchClass,
          }));
  }
}

function chordQualityOf(reading: SonorityReading): HarmonyEvent['chord']['quality'] {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
      return reading.quality;
    default:
      return 'other';
  }
}

function chordRootOf(reading: SonorityReading, segment: AnalyzedSegment): SpelledPitchClass {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
    case 'open_fifth':
      return reading.root;
    case 'monad':
      return reading.tone;
    default:
      return {
        letter: segment.bassPitch.letter,
        accidental: segment.bassPitch.accidental,
        pitchClass: segment.bassPitch.pitchClass,
      };
  }
}

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

/** True when the reading's root is this pitch class and it names a chord. */
function rootedAt(reading: SonorityReading, pc: number): boolean {
  return (
    (reading.kind === 'exact' ||
      reading.kind === 'subset' ||
      reading.kind === 'incomplete_triad' ||
      reading.kind === 'open_fifth') &&
    reading.root.pitchClass === pc
  );
}

export function annotateVoicing(
  voicing: SATBVoicing,
  fragment: MelodyFragment,
  context: TonalContext,
  approach: ApproachContext | null,
  idPrefix: string,
): AnnotationResult {
  const lines = placedVoiceLines(voicing);
  const seamPitchClasses = approach
    ? Object.fromEntries(
        Object.entries(approach.voices).map(([voice, arrival]) => [
          voice,
          arrival.pitch.pitchClass,
        ]),
      )
    : {};
  const segments = segmentSurface(voicing, seamPitchClasses);
  const evidence: AnalysisEvidence[] = [];

  // ---- harmony events, with the cadential-6/4 sequence refinement ----
  const dominantPc = (context.tonicPitchClass + 7) % 12;
  const harmonyEvents: HarmonyEvent[] = segments.map((segment, index) => {
    const key = analyzeInKey(context, segment.reading, segment.bassPitch);
    let analysis = key.analysis;
    const nextSegment = segments[index + 1];
    const isCadentialSixFour =
      key.inversion === 2 &&
      (segment.reading.kind === 'exact' || segment.reading.kind === 'subset') &&
      segment.reading.template.intervals.length === 3 &&
      segment.reading.root.pitchClass === context.tonicPitchClass &&
      nextSegment !== undefined &&
      rootedAt(nextSegment.reading, dominantPc) &&
      metricStrengthAt(segment.start) !== 'weak';
    if (isCadentialSixFour) {
      analysis = { ...analysis, functionTags: ['dominant'] };
      evidence.push(
        makeEvidence(
          `${idPrefix}-cad64-${index}`,
          'cadence_reading',
          'cadential_six_four',
          'A tonic chord over the dominant bass on a strong beat, moving to V — it behaves as part of the dominant, not as a tonic arrival.',
        ),
      );
    }
    const tones = chordTonesOf(segment.reading, segment);
    return {
      id: `${idPrefix}-dh${index}`,
      start: unitsToTime(segment.start),
      duration: unitsToDuration(segment.units),
      chord: {
        id: `${idPrefix}-son${index}`,
        root: chordRootOf(segment.reading, segment),
        pitchClasses: tones.map((tone) => tone.pitchClass),
        spelledChordTones: tones,
        quality: chordQualityOf(segment.reading),
      },
      analysis,
      inversion: key.inversion,
      bassPitch: segment.bassPitch,
      displaySymbol: key.displaySymbol,
      ...(segment.suspensionFigure
        ? { figuredBass: segment.suspensionFigure }
        : key.figuredBass !== undefined
          ? { figuredBass: key.figuredBass }
          : {}),
    };
  });

  // ---- melody interpretations (seam-aware) ----
  const approachReading = approach?.harmony ? readingFromStoredChord(approach.harmony) : null;
  const approachSoprano = approach?.voices.soprano ?? null;

  const melodyInterpretations: MelodyInterpretation[] = fragment.events.map((event, index) => {
    const span = toTimelineSpan(event.start, event.duration);
    const startUnit = span.startUnit - 1;
    const segmentIndex = segments.findIndex(
      (segment) => segment.start <= startUnit && startUnit < segment.start + segment.units,
    );
    const segment = segmentIndex === -1 ? null : segments[segmentIndex];
    const harmony = segmentIndex === -1 ? null : harmonyEvents[segmentIndex];
    const idSeed = `${idPrefix}-int-${index}`;

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

    if (member) {
      // A sustained note can outlive its chord: member at its start, but a
      // non-member of a LATER covering segment — the suspension shape (fixture
      // B's held do over the arriving V). Check every segment the note spans.
      const noteEnd = startUnit + span.spanUnits;
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
        const nextEvent = fragment.events[index + 1] ?? null;
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

    // Not a chord tone — classify with the full window, reaching across the
    // seam for the first note's preparation (the approach hook, cashed).
    const previousEvent = fragment.events[index - 1] ?? null;
    const nextEvent = fragment.events[index + 1] ?? null;
    const prev: PlacedNote | null = previousEvent
      ? (() => {
          const previousSpan = toTimelineSpan(previousEvent.start, previousEvent.duration);
          return {
            pitch: previousEvent.pitch,
            startUnit: previousSpan.startUnit - 1,
            units: previousSpan.spanUnits,
            eventId: previousEvent.id,
          };
        })()
      : approachSoprano
        ? {
            pitch: approachSoprano.pitch,
            startUnit: startUnit - 4,
            units: 4,
            eventId: 'approach:soprano',
          }
        : null;
    const next: PlacedNote | null = nextEvent
      ? (() => {
          const nextSpan = toTimelineSpan(nextEvent.start, nextEvent.duration);
          return {
            pitch: nextEvent.pitch,
            startUnit: nextSpan.startUnit - 1,
            units: nextSpan.spanUnits,
            eventId: nextEvent.id,
          };
        })()
      : null;
    const prevChord =
      segmentIndex > 0 ? segments[segmentIndex - 1].reading : approachReading;
    const nextChord =
      segmentIndex < segments.length - 1 ? segments[segmentIndex + 1].reading : null;

    const classification = classifyNonChordTone(
      {
        voice: 'soprano',
        prev,
        cur: { pitch: event.pitch, startUnit, units: span.spanUnits, eventId: event.id },
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
  });

  // ---- candidate-level facts ----
  for (const fact of checkVoiceLeading(lines, segments, context)) {
    evidence.push(
      makeEvidence(
        `${idPrefix}-vl-${fact.id}-${fact.atUnit}-${fact.voices.join('')}`,
        fact.id,
        `${fact.voices.join('+')}@u${fact.atUnit}`,
        fact.detail,
      ),
    );
  }
  const sanity = keySanityCheck(voicing, context, `${idPrefix}-key-sanity`);
  if (sanity) evidence.push(sanity);

  return { harmonyEvents, melodyInterpretations, evidence };
}
