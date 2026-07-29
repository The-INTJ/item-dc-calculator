/**
 * Derive harmony FROM the sounding notes — the SATB surface is the source of
 * truth. Drew's rule: an edit to one note never moves another note; the notes
 * drive the analysis. The melody is not a chord assigner — the whole SATB is
 * the surface we generate around.
 *
 * Mechanical only: segment the timeline at every note boundary, name each
 * segment's sonority when its pitch-class set matches a known chord shape
 * (root preference: the bass note first — so A/C/E/G reads Am7, not C6), and
 * show `?` plus the sounding notes when nothing matches. Roman numerals only
 * where the root maps to a scale degree. Same honesty contract as
 * enumerate.ts: naming a full sonority is pure math; whether it WORKS is
 * judgment the naive layer never fakes.
 */

import type {
  AnalysisEvidence,
  CandidatePath,
  DerivabilityNote,
  MelodyInterpretation,
} from './analysis-types';
import type {
  ChordQuality,
  HarmonyEvent,
  MelodyFragment,
  SATBVoicing,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from './music-types';
import { scaleDegreeForPitchClass } from './scale';
import { toTimelineSpan, unitsToDuration, unitsToTime } from './timing';

export const USER_GENERATOR_ID = 'user-surface';
const GENERATOR_VERSION = '0.1.0';

const DEGREE_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

interface SonorityTemplate {
  intervals: number[];
  quality: ChordQuality;
  /** Chord-symbol suffix (Cm7, G7, Fdim…). */
  suffix: string;
  /** Roman-numeral suffix (V7, ii7, vii°7…). */
  numeralSuffix: string;
  lowercaseNumeral: boolean;
}

/** Every shape the naive namer recognizes, checked with each sounding pc as root. */
const TEMPLATES: SonorityTemplate[] = [
  { intervals: [0, 4, 7], quality: 'major', suffix: '', numeralSuffix: '', lowercaseNumeral: false },
  { intervals: [0, 3, 7], quality: 'minor', suffix: 'm', numeralSuffix: '', lowercaseNumeral: true },
  { intervals: [0, 3, 6], quality: 'diminished', suffix: 'dim', numeralSuffix: '°', lowercaseNumeral: true },
  { intervals: [0, 4, 8], quality: 'augmented', suffix: 'aug', numeralSuffix: '+', lowercaseNumeral: false },
  { intervals: [0, 4, 7, 10], quality: 'dominant_seventh', suffix: '7', numeralSuffix: '7', lowercaseNumeral: false },
  { intervals: [0, 4, 7, 11], quality: 'major_seventh', suffix: 'maj7', numeralSuffix: 'maj7', lowercaseNumeral: false },
  { intervals: [0, 3, 7, 10], quality: 'minor_seventh', suffix: 'm7', numeralSuffix: '7', lowercaseNumeral: true },
  { intervals: [0, 3, 6, 10], quality: 'half_diminished_seventh', suffix: 'ø7', numeralSuffix: 'ø7', lowercaseNumeral: true },
  { intervals: [0, 3, 6, 9], quality: 'fully_diminished_seventh', suffix: '°7', numeralSuffix: '°7', lowercaseNumeral: true },
  { intervals: [0, 5, 7], quality: 'suspended_fourth', suffix: 'sus4', numeralSuffix: 'sus4', lowercaseNumeral: false },
  { intervals: [0, 2, 7], quality: 'suspended_second', suffix: 'sus2', numeralSuffix: 'sus2', lowercaseNumeral: false },
];

interface IdentifiedSonority {
  rootPc: number;
  template: SonorityTemplate;
}

/** Name a distinct-pc set if it matches a template exactly; bass-first root scan. */
function identifySonority(pcs: number[], bassPc: number): IdentifiedSonority | null {
  if (pcs.length < 3) return null;
  const rootOrder = [bassPc, ...pcs.filter((pc) => pc !== bassPc)];
  for (const rootPc of rootOrder) {
    const relative = new Set(pcs.map((pc) => (pc - rootPc + 12) % 12));
    for (const template of TEMPLATES) {
      if (
        relative.size === template.intervals.length &&
        template.intervals.every((interval) => relative.has(interval))
      ) {
        return { rootPc, template };
      }
    }
  }
  return null;
}

function toPitchClassSpelling(pitch: SpelledPitch): SpelledPitchClass {
  return { letter: pitch.letter, accidental: pitch.accidental, pitchClass: pitch.pitchClass };
}

function accidentalText(pitch: SpelledPitchClass): string {
  return pitch.accidental === 'natural' ? '' : pitch.accidental;
}

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

function numeralFor(context: TonalContext, sonority: IdentifiedSonority): string {
  const info = scaleDegreeForPitchClass(context, sonority.rootPc);
  if (!info) return '?';
  const base = DEGREE_NUMERALS[info.degree - 1];
  const cased = sonority.template.lowercaseNumeral ? base.toLowerCase() : base;
  const prefix = info.chromaticOffset === 1 ? '#' : '';
  return `${prefix}${cased}${sonority.template.numeralSuffix}`;
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
    const bassSpelling = toPitchClassSpelling(lowest);
    const sonority = identifySonority(segment.pcs, lowest.pitchClass);
    const id = `${idPrefix}-dh${index}`;

    if (!sonority) {
      // Not a shape the namer knows — show exactly what sounds.
      const tones = segment.pitches
        .filter(
          (pitch, i, all) => all.findIndex((p) => p.pitchClass === pitch.pitchClass) === i,
        )
        .map(toPitchClassSpelling);
      return {
        id,
        start: unitsToTime(segment.start),
        duration: unitsToDuration(segment.units),
        chord: {
          id: `${idPrefix}-son${index}`,
          root: bassSpelling,
          pitchClasses: tones.map((tone) => tone.pitchClass),
          spelledChordTones: tones,
          quality: 'other' as const,
        },
        analysis: {
          romanNumeral: '?',
          scaleDegreeRoot: scaleDegreeForPitchClass(context, lowest.pitchClass) ?? {
            degree: 1,
            chromaticOffset: 0,
            syllable: 'do',
          },
          functionTags: [],
        },
        inversion: 0,
        bassPitch: lowest,
        displaySymbol: segment.pitches
          .map((pitch) => `${pitch.letter}${pitch.accidental === 'natural' ? '' : pitch.accidental}`)
          .filter((label, i, all) => all.indexOf(label) === i)
          .join('+'),
      };
    }

    const rootPitch =
      segment.pitches.find((pitch) => pitch.pitchClass === sonority.rootPc) ?? lowest;
    const rootSpelling = toPitchClassSpelling(rootPitch);
    // Chord tones stacked from the root, spelled from the sounding instances.
    const stackedTones: SpelledPitchClass[] = sonority.template.intervals.map((interval) => {
      const pc = (sonority.rootPc + interval) % 12;
      const instance = segment.pitches.find((pitch) => pitch.pitchClass === pc);
      return instance ? toPitchClassSpelling(instance) : { ...rootSpelling, pitchClass: pc };
    });
    const bassRelative = (lowest.pitchClass - sonority.rootPc + 12) % 12;
    const inversion = Math.min(
      3,
      Math.max(0, sonority.template.intervals.indexOf(bassRelative)),
    ) as 0 | 1 | 2 | 3;
    return {
      id,
      start: unitsToTime(segment.start),
      duration: unitsToDuration(segment.units),
      chord: {
        id: `${idPrefix}-son${index}`,
        root: rootSpelling,
        pitchClasses: stackedTones.map((tone) => tone.pitchClass),
        spelledChordTones: stackedTones,
        quality: sonority.template.quality,
      },
      analysis: {
        romanNumeral: numeralFor(context, sonority),
        scaleDegreeRoot: scaleDegreeForPitchClass(context, sonority.rootPc) ?? {
          degree: 1,
          chromaticOffset: 0,
          syllable: 'do',
        },
        functionTags: [],
      },
      inversion,
      bassPitch: lowest,
      displaySymbol: `${rootSpelling.letter}${accidentalText(rootSpelling)}${sonority.template.suffix}`,
    };
  });
}

/** Membership readings against derived harmony — mechanical, like enumerate's. */
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
    const named = covering !== undefined && covering.chord.quality !== 'other';
    const evidence: AnalysisEvidence = {
      id: `${idPrefix}-dint-${index}`,
      source: 'computed',
      featureId: 'derived_sonority_membership',
      value: named,
      explanation: named
        ? `${event.pitch.letter} sounds inside the ${covering.displaySymbol} the voices form here.`
        : `The notes sounding here form no shape the naive namer knows — shown as ? with the notes themselves.`,
      providerId: USER_GENERATOR_ID,
      providerVersion: GENERATOR_VERSION,
    };
    return {
      melodyEventId: event.id,
      harmonyEventIds: covering ? [covering.id] : [],
      role: named ? 'chord_tone' : 'unclassified',
      explanation: evidence.explanation ?? '',
      evidence: [evidence],
    };
  });
}

export const USER_EDIT_DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'computed',
    note: 'Chords are named from the sounding notes — pure math. Spans that form no known shape show ? with the notes.',
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
