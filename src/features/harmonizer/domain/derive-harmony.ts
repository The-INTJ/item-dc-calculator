/**
 * Derive harmony FROM the sounding notes — the SATB surface is the source of
 * truth. Drew's rule: an edit to one note never moves another note; the notes
 * drive the analysis. The melody is not a chord assigner — the whole SATB is
 * the surface we generate around.
 *
 * Mechanical only: segment the timeline at every note boundary, name each
 * segment's sonority via the engine's fallback ladder (exact template →
 * incomplete triad → open fifth → dyad-with-candidates → best-subset →
 * honest `?`), and read it in the key (numerals with inversion figures,
 * slash symbols, figured bass). Root preference: the bass note first — so
 * A/C/E/G reads Am7, not C6. Naming a full sonority is pure math; whether it
 * WORKS is judgment this layer never fakes.
 */

import type {
  AnalysisEvidence,
  CandidatePath,
  DerivabilityNote,
  MelodyInterpretation,
} from './analysis-types';
import type {
  HarmonyEvent,
  MelodyFragment,
  SATBVoicing,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from './music-types';
import { identifySonority, type SonorityReading } from './engine/chord-id';
import { analyzeInKey } from './engine/roman';
import { toTimelineSpan, unitsToDuration, unitsToTime } from './timing';

export const USER_GENERATOR_ID = 'user-surface';
const GENERATOR_VERSION = '1.0.0';

interface SoundingSegment {
  /** 0-based unit start. */
  start: number;
  units: number;
  /** All sounding pitches, lowest first (duplicates by midi collapsed). */
  pitches: SpelledPitch[];
  /** Distinct pitch classes, in low-to-high first-appearance order. */
  pcs: number[];
}

function segmentVoicing(voicing: SATBVoicing): SoundingSegment[] {
  const placed = [
    ...voicing.soprano,
    ...voicing.alto,
    ...voicing.tenor,
    ...voicing.bass,
  ].map((event) => {
    const span = toTimelineSpan(event.start, event.duration);
    return { pitch: event.pitch, start: span.startUnit - 1, end: span.startUnit - 1 + span.spanUnits };
  });
  if (placed.length === 0) return [];
  const boundaries = [...new Set(placed.flatMap((note) => [note.start, note.end]))].sort(
    (a, b) => a - b,
  );

  const segments: SoundingSegment[] = [];
  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    const sounding = placed.filter((note) => note.start < end && start < note.end);
    if (sounding.length === 0) continue;
    const pitches: SpelledPitch[] = [];
    for (const note of [...sounding].sort((a, b) => a.pitch.midi - b.pitch.midi)) {
      if (!pitches.some((pitch) => pitch.midi === note.pitch.midi)) pitches.push(note.pitch);
    }
    const pcs: number[] = [];
    for (const pitch of pitches) {
      if (!pcs.includes(pitch.pitchClass)) pcs.push(pitch.pitchClass);
    }
    const previous = segments[segments.length - 1];
    if (
      previous &&
      previous.start + previous.units === start &&
      previous.pcs.length === pcs.length &&
      previous.pcs.every((pc, index) => pcs[index] === pc)
    ) {
      previous.units += end - start; // same sonority continuing — one segment
    } else {
      segments.push({ start, units: end - start, pitches, pcs });
    }
  }
  return segments;
}

function toPitchClassSpelling(pitch: SpelledPitch): SpelledPitchClass {
  return { letter: pitch.letter, accidental: pitch.accidental, pitchClass: pitch.pitchClass };
}

/** The chord tones a reading asserts; sounding tones when it asserts none. */
function chordTonesOf(reading: SonorityReading, segment: SoundingSegment): SpelledPitchClass[] {
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
        : segment.pitches.map(toPitchClassSpelling);
  }
}

function chordQualityOf(reading: SonorityReading): HarmonyEvent['chord']['quality'] {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
      return reading.quality;
    case 'incomplete_triad':
      return reading.quality;
    default:
      return 'other';
  }
}

function chordRootOf(reading: SonorityReading, bass: SpelledPitch): SpelledPitchClass {
  switch (reading.kind) {
    case 'exact':
    case 'subset':
    case 'incomplete_triad':
    case 'open_fifth':
      return reading.root;
    case 'monad':
      return reading.tone;
    default:
      return toPitchClassSpelling(bass);
  }
}

/**
 * The chord strip of a working reading, computed from its own notes. Never
 * moves a note; only says what the notes currently form.
 */
export function deriveHarmonyFromVoicing(
  voicing: SATBVoicing,
  context: TonalContext,
  idPrefix: string,
): HarmonyEvent[] {
  return segmentVoicing(voicing).map((segment, index) => {
    const lowest = segment.pitches[0];
    const reading = identifySonority({ pitches: segment.pitches, bassPc: lowest.pitchClass });
    const key = analyzeInKey(context, reading, lowest);
    const tones = chordTonesOf(reading, segment);
    return {
      id: `${idPrefix}-dh${index}`,
      start: unitsToTime(segment.start),
      duration: unitsToDuration(segment.units),
      chord: {
        id: `${idPrefix}-son${index}`,
        root: chordRootOf(reading, lowest),
        pitchClasses: tones.map((tone) => tone.pitchClass),
        spelledChordTones: tones,
        quality: chordQualityOf(reading),
      },
      analysis: key.analysis,
      inversion: key.inversion,
      bassPitch: lowest,
      displaySymbol: key.displaySymbol,
      ...(key.figuredBass !== undefined ? { figuredBass: key.figuredBass } : {}),
    };
  });
}

/** Membership readings against derived harmony — mechanical, until rule packs land. */
function interpretMelody(
  fragment: MelodyFragment,
  harmonyEvents: HarmonyEvent[],
  idPrefix: string,
): MelodyInterpretation[] {
  return fragment.events.map((event, index) => {
    const span = toTimelineSpan(event.start, event.duration);
    const start = span.startUnit - 1;
    const covering = harmonyEvents.find((harmony) => {
      const harmonySpan = toTimelineSpan(harmony.start, harmony.duration);
      const harmonyStart = harmonySpan.startUnit - 1;
      return harmonyStart <= start && start < harmonyStart + harmonySpan.spanUnits;
    });
    const member =
      covering !== undefined && covering.chord.pitchClasses.includes(event.pitch.pitchClass);
    const evidence: AnalysisEvidence = {
      id: `${idPrefix}-dint-${index}`,
      source: 'computed',
      featureId: 'chord_membership',
      value: member,
      explanation: member
        ? `${event.pitch.letter} sounds inside the ${covering!.displaySymbol} the voices form here.`
        : covering
          ? `${event.pitch.letter} is not a tone of the ${covering.displaySymbol} sounding here; classifying it needs the non-chord-tone rules.`
          : `No harmony covers this span yet.`,
      providerId: USER_GENERATOR_ID,
      providerVersion: GENERATOR_VERSION,
    };
    return {
      melodyEventId: event.id,
      harmonyEventIds: covering ? [covering.id] : [],
      role: member ? 'chord_tone' : 'unclassified',
      explanation: evidence.explanation ?? '',
      evidence: [evidence],
    };
  });
}

export const USER_EDIT_DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'computed',
    note: 'Chords are named from the sounding notes — pure math. Incomplete shapes are named for what they are (open fifth, missing fifth); spans that form no known shape show ? with the notes.',
  },
  {
    aspect: 'voicing',
    status: 'computed',
    note: 'The voicing is yours; an edit never moves another note.',
  },
  {
    aspect: 'ranking',
    status: 'needs_data',
    note: 'Whether this reading works musically is judgment — custom style data.',
  },
  {
    aspect: 'interpretation',
    status: 'needs_data',
    note: 'Analysis derived from the notes hears every note as sounding; passing/suspension readings need rule packs.',
  },
  {
    aspect: 'effects',
    status: 'needs_data',
    note: 'Feel and effect labels are curated content; nothing to compute here.',
  },
];

/**
 * Refresh a working reading's analysis from its own notes after an edit (or
 * key change). The notes are untouched; harmony, interpretations, provenance,
 * and derivability flip to the derived-from-surface form. Deterministic —
 * safe inside the reducer.
 */
export function withDerivedAnalysis(
  candidate: CandidatePath,
  fragment: MelodyFragment,
  context: TonalContext,
): CandidatePath {
  const harmonyEvents = deriveHarmonyFromVoicing(candidate.voicing, context, candidate.id);
  const melodyInterpretations = interpretMelody(fragment, harmonyEvents, candidate.id);
  const alreadyDerived = candidate.provenance.generatorId === USER_GENERATOR_ID;
  return {
    ...candidate,
    tonalContext: context,
    harmonyEvents,
    melodyInterpretations,
    summary: alreadyDerived
      ? candidate.summary
      : 'Your working reading — the notes are the source of truth; chords are identified from what sounds.',
    descriptors: alreadyDerived ? candidate.descriptors : [],
    evidence: [
      {
        id: `${candidate.id}-ev-derived`,
        source: 'computed',
        featureId: 'analysis_rederived',
        value: true,
        explanation:
          'Analysis re-derived from the sounding notes — the notes drive the chords, never the reverse.',
        providerId: USER_GENERATOR_ID,
        providerVersion: GENERATOR_VERSION,
      },
    ],
    provenance: {
      generatorId: USER_GENERATOR_ID,
      generatorVersion: GENERATOR_VERSION,
      knowledgePackIds: [],
      fixtureAuthored: false,
    },
    derivability: USER_EDIT_DERIVABILITY_NOTES,
  };
}
