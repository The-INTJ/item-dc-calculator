/**
 * The naive computed layer — the derivability probe.
 *
 * Generates skeleton candidate paths from MECHANICAL facts only (spec §20.1
 * "strongly computable"): diatonic triad construction, chord-tone membership,
 * common-tone counts, root distinctness. It makes no style judgments; every
 * aspect it cannot compute is labeled in each skeleton's `derivability` notes,
 * its evidence is `computed` (one `rule` entry for the conventional raised
 * leading tone in minor), and its voicing is an explicitly naive root-position
 * stack. Fully deterministic: no randomness, ids derived from content.
 */

import type {
  AnalysisEvidence,
  CandidatePath,
  DerivabilityNote,
  MelodyInterpretation,
} from './analysis-types';
import type {
  ChordQuality,
  DiatonicDegree,
  HarmonyEvent,
  MelodyEvent,
  MelodyFragment,
  PhraseIntent,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
  VoiceEvent,
} from './music-types';
import { diatonicPitch, syllableForDegree } from './scale';
import { toTimelineSpan, unitsToDuration, unitsToTime } from './timing';

export interface EnumeratedChord {
  /** Stable key for ids and diversity comparison, e.g. "d5", "d5x7", "d5raised". */
  key: string;
  rootDegree: DiatonicDegree;
  romanNumeral: string;
  quality: ChordQuality;
  pitchClasses: number[];
  members: Array<{ degree: DiatonicDegree; chromaticOffset: number }>;
}

export interface LockedPitchConstraint {
  startUnit: number;
  units: number;
  pitchClass: number;
}

const GENERATOR_ID = 'naive-enumerator';
const GENERATOR_VERSION = '0.1.0';
const MAX_RAW_PATHS = 24;
const PICK_COUNT = 3;

const DEGREE_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
const QUALITY_SUFFIX: Partial<Record<ChordQuality, string>> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  dominant_seventh: '7',
};

export const DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'computed',
    note: 'Chord options are enumerable from note membership — pure math.',
  },
  {
    aspect: 'ranking',
    status: 'unsure',
    note: 'Ordered by shared tones only; musical preference needs style rules or data.',
  },
  {
    aspect: 'voicing',
    status: 'unsure',
    note: 'Naive root-position stack — idiomatic SATB voicing needs a solver and/or curated data.',
  },
  {
    aspect: 'interpretation',
    status: 'needs_data',
    note: 'Non-chord-tone readings (passing, suspension…) need rule packs.',
  },
  {
    aspect: 'effects',
    status: 'needs_data',
    note: 'Feel and effect labels are curated content; nothing to compute here.',
  },
];

function wrapDegree(value: number): DiatonicDegree {
  return (((value - 1) % 7) + 7) % 7 + 1 as DiatonicDegree;
}

interface ModeIntervals {
  intervals: number[];
}

function modeIntervals(context: TonalContext): ModeIntervals | null {
  if (context.mode === 'major') return { intervals: [0, 2, 4, 5, 7, 9, 11] };
  if (context.mode === 'natural_minor' && context.minorDoSystem === 'la_based') {
    return { intervals: [0, 2, 3, 5, 7, 8, 10] };
  }
  return null;
}

function triadQuality(third: number, fifth: number): ChordQuality {
  if (third === 4 && fifth === 7) return 'major';
  if (third === 3 && fifth === 7) return 'minor';
  if (third === 3 && fifth === 6) return 'diminished';
  if (third === 4 && fifth === 8) return 'augmented';
  return 'other';
}

function numeralFor(degree: DiatonicDegree, quality: ChordQuality): string {
  const base = DEGREE_NUMERALS[degree - 1];
  if (quality === 'major' || quality === 'augmented' || quality === 'dominant_seventh') {
    return base;
  }
  const lower = base.toLowerCase();
  return quality === 'diminished' ? `${lower}°` : lower;
}

/** The context's naive chord vocabulary; null for unsupported contexts. */
export function enumerateChords(context: TonalContext): EnumeratedChord[] | null {
  const mode = modeIntervals(context);
  if (!mode) return null;
  const pcOf = (degree: DiatonicDegree, offset = 0) =>
    (((context.tonicPitchClass + mode.intervals[degree - 1] + offset) % 12) + 12) % 12;

  const chords: EnumeratedChord[] = [];
  for (let d = 1 as DiatonicDegree; d <= 7; d = (d + 1) as DiatonicDegree) {
    const members = [d, wrapDegree(d + 2), wrapDegree(d + 4)].map((degree) => ({
      degree,
      chromaticOffset: 0,
    }));
    const pcs = members.map((member) => pcOf(member.degree));
    const third = (pcs[1] - pcs[0] + 12) % 12;
    const fifth = (pcs[2] - pcs[0] + 12) % 12;
    const quality = triadQuality(third, fifth);
    chords.push({
      key: `d${d}`,
      rootDegree: d,
      romanNumeral: numeralFor(d, quality),
      quality,
      pitchClasses: pcs,
      members,
    });
  }

  if (context.mode === 'major') {
    // V7 — the one seventh chord in the naive vocabulary.
    const members = [5, 7, 2, 4].map((value) => ({
      degree: wrapDegree(value),
      chromaticOffset: 0,
    }));
    chords.push({
      key: 'd5x7',
      rootDegree: 5,
      romanNumeral: 'V7',
      quality: 'dominant_seventh',
      pitchClasses: members.map((member) => pcOf(member.degree)),
      members,
    });
  } else {
    // Conventional raised leading tone: major V in minor (evidence: rule).
    const members = [
      { degree: 5 as DiatonicDegree, chromaticOffset: 0 },
      { degree: 7 as DiatonicDegree, chromaticOffset: 1 },
      { degree: 2 as DiatonicDegree, chromaticOffset: 0 },
    ];
    chords.push({
      key: 'd5raised',
      rootDegree: 5,
      romanNumeral: 'V',
      quality: 'major',
      pitchClasses: members.map((member) => pcOf(member.degree, member.chromaticOffset)),
      members,
    });
  }
  return chords;
}

function spellMember(
  context: TonalContext,
  member: { degree: DiatonicDegree; chromaticOffset: number },
): SpelledPitchClass | null {
  const base = diatonicPitch(context, member.degree, 4);
  if (!base) return null;
  if (member.chromaticOffset === 0) {
    return { letter: base.letter, accidental: base.accidental, pitchClass: base.pitchClass };
  }
  if (member.chromaticOffset === 1) {
    const raised: Record<string, SpelledPitchClass['accidental']> = {
      bb: 'b',
      b: 'natural',
      natural: '#',
      '#': 'x',
    };
    const accidental = raised[base.accidental];
    if (!accidental) return null;
    return { letter: base.letter, accidental, pitchClass: (base.pitchClass + 1) % 12 };
  }
  return null;
}

/** First octave placement of a pitch class spelling at or above a midi floor. */
function placeAbove(
  context: TonalContext,
  member: { degree: DiatonicDegree; chromaticOffset: number },
  minMidi: number,
): SpelledPitch | null {
  for (let octave = 1; octave <= 6; octave += 1) {
    const base = diatonicPitch(context, member.degree, octave);
    if (!base) return null;
    const midi = base.midi + member.chromaticOffset;
    if (midi >= minMidi) {
      const spelled = spellMember(context, member);
      if (!spelled) return null;
      return { ...spelled, octave, midi };
    }
  }
  return null;
}

interface Segment {
  chord: EnumeratedChord;
  startUnit: number;
  units: number;
}

function commonTones(a: EnumeratedChord, b: EnumeratedChord): number {
  return a.pitchClasses.filter((pc) => b.pitchClasses.includes(pc)).length;
}

/**
 * Enumerate skeleton candidates for a melody in a supported context. Returns
 * [] when the context is unsupported, any note has no supporting chord under
 * the lock constraints, or the fragment is empty.
 */
export function assembleSkeletons(
  fragment: MelodyFragment,
  context: TonalContext,
  phraseIntent: PhraseIntent,
  lockedPitches: LockedPitchConstraint[] = [],
): CandidatePath[] {
  const chords = enumerateChords(context);
  const events = fragment.events;
  if (!chords || events.length === 0) return [];

  const spans = events.map((event) => {
    const span = toTimelineSpan(event.start, event.duration);
    return { start: span.startUnit - 1, units: span.spanUnits };
  });

  const optionsPerEvent = events.map((event, index) => {
    const span = spans[index];
    const overlappingLocks = lockedPitches.filter(
      (lock) => lock.startUnit < span.start + span.units && span.start < lock.startUnit + lock.units,
    );
    return chords.filter(
      (chord) =>
        chord.pitchClasses.includes(event.pitch.pitchClass) &&
        overlappingLocks.every((lock) => chord.pitchClasses.includes(lock.pitchClass)),
    );
  });
  if (optionsPerEvent.some((options) => options.length === 0)) return [];

  // Depth-first cross product, capped — stable order keeps this deterministic.
  const rawPaths: EnumeratedChord[][] = [];
  const walk = (index: number, path: EnumeratedChord[]) => {
    if (rawPaths.length >= MAX_RAW_PATHS) return;
    if (index === events.length) {
      rawPaths.push([...path]);
      return;
    }
    for (const chord of optionsPerEvent[index]) {
      path.push(chord);
      walk(index + 1, path);
      path.pop();
      if (rawPaths.length >= MAX_RAW_PATHS) return;
    }
  };
  walk(0, []);
  if (rawPaths.length === 0) return [];

  const scored = rawPaths
    .map((path) => ({
      path,
      keySequence: path.map((chord) => chord.key).join('.'),
      commonToneSum: path
        .slice(1)
        .reduce((sum, chord, index) => sum + commonTones(path[index], chord), 0),
    }))
    .sort(
      (a, b) => b.commonToneSum - a.commonToneSum || a.keySequence.localeCompare(b.keySequence),
    );

  // Greedy diversity: maximize positions that differ from every already-picked path.
  const picked: typeof scored = [];
  while (picked.length < PICK_COUNT && picked.length < scored.length) {
    let best: (typeof scored)[number] | null = null;
    let bestDifference = -1;
    for (const entry of scored) {
      if (picked.includes(entry)) continue;
      const difference = picked.reduce(
        (sum, chosen) =>
          sum +
          entry.path.filter((chord, index) => chosen.path[index]?.key !== chord.key).length,
        0,
      );
      if (difference > bestDifference) {
        bestDifference = difference;
        best = entry;
      }
    }
    if (!best) break;
    picked.push(best);
  }

  return picked
    .map((entry, index) => buildSkeleton(entry.path, entry.commonToneSum, index, {
      fragment,
      context,
      phraseIntent,
      spans,
    }))
    .filter((candidate): candidate is CandidatePath => candidate !== null);
}

function buildSkeleton(
  path: EnumeratedChord[],
  commonToneSum: number,
  index: number,
  input: {
    fragment: MelodyFragment;
    context: TonalContext;
    phraseIntent: PhraseIntent;
    spans: Array<{ start: number; units: number }>;
  },
): CandidatePath | null {
  const { fragment, context, phraseIntent, spans } = input;
  const id = `gen-${index}-${path.map((chord) => chord.key).join('.')}`;

  // Merge consecutive identical chords into single harmony segments.
  const segments: Segment[] = [];
  path.forEach((chord, eventIndex) => {
    const span = spans[eventIndex];
    const last = segments[segments.length - 1];
    if (last && last.chord.key === chord.key && last.startUnit + last.units === span.start) {
      last.units += span.units;
    } else {
      segments.push({ chord, startUnit: span.start, units: span.units });
    }
  });

  const harmonyEvents: HarmonyEvent[] = [];
  const alto: VoiceEvent[] = [];
  const tenor: VoiceEvent[] = [];
  const bass: VoiceEvent[] = [];

  for (let s = 0; s < segments.length; s += 1) {
    const segment = segments[s];
    const chord = segment.chord;
    const root = spellMember(context, chord.members[0]);
    const tones = chord.members.map((member) => spellMember(context, member));
    if (!root || tones.some((tone) => tone === null)) return null;

    const bassPitch = placeAbove(context, chord.members[0], 40); // >= E2 region
    const tenorPitch = bassPitch ? placeAbove(context, chord.members[1], bassPitch.midi + 1) : null;
    const altoPitch = tenorPitch ? placeAbove(context, chord.members[2], tenorPitch.midi + 1) : null;
    if (!bassPitch || !tenorPitch || !altoPitch) return null;

    const suffix = QUALITY_SUFFIX[chord.quality] ?? '';
    const accidentalText = root.accidental === 'natural' ? '' : root.accidental;
    const harmonyId = `${id}-h${s}`;
    harmonyEvents.push({
      id: harmonyId,
      start: unitsToTime(segment.startUnit),
      duration: unitsToDuration(segment.units),
      chord: {
        id: `gen-chord-${chord.key}`,
        root,
        pitchClasses: chord.pitchClasses,
        spelledChordTones: tones as SpelledPitchClass[],
        quality: chord.quality,
      },
      analysis: {
        romanNumeral: chord.romanNumeral,
        scaleDegreeRoot: {
          degree: chord.rootDegree,
          chromaticOffset: 0,
          syllable: syllableForDegree(context, chord.rootDegree, 0) ?? 'do',
        },
        functionTags: [],
      },
      inversion: 0,
      bassPitch,
      displaySymbol: `${root.letter}${accidentalText}${suffix}`,
    });

    const makeVoiceEvent = (
      voice: VoiceEvent['voice'],
      pitch: SpelledPitch,
      member: { degree: DiatonicDegree; chromaticOffset: number },
    ): VoiceEvent => ({
      id: `${harmonyId}-${voice}`,
      voice,
      pitch,
      scaleDegree: {
        degree: member.degree,
        chromaticOffset: member.chromaticOffset,
        syllable: syllableForDegree(context, member.degree, member.chromaticOffset) ?? 'do',
      },
      start: unitsToTime(segment.startUnit),
      duration: unitsToDuration(segment.units),
      tieFromPrevious: false,
    });
    bass.push(makeVoiceEvent('bass', bassPitch, chord.members[0]));
    tenor.push(makeVoiceEvent('tenor', tenorPitch, chord.members[1]));
    alto.push(makeVoiceEvent('alto', altoPitch, chord.members[2]));
  }

  const soprano: VoiceEvent[] = fragment.events.map((event, i) => ({
    id: `${id}-s${i}`,
    voice: 'soprano',
    pitch: event.pitch,
    scaleDegree: event.scaleDegree,
    start: event.start,
    duration: event.duration,
    tieFromPrevious: event.tieFromPrevious,
  }));

  const melodyInterpretations: MelodyInterpretation[] = fragment.events.map((event, i) => {
    const segment = segments.find(
      (candidate) =>
        candidate.startUnit <= spans[i].start &&
        spans[i].start < candidate.startUnit + candidate.units,
    );
    const member = segment?.chord.pitchClasses.includes(event.pitch.pitchClass) ?? false;
    const harmonyId = segment ? `${id}-h${segments.indexOf(segment)}` : '';
    const evidence: AnalysisEvidence = {
      id: `${id}-int-${i}`,
      source: 'computed',
      featureId: 'chord_membership',
      value: member,
      explanation: member
        ? `${event.pitch.letter} is a tone of the chosen chord (membership check).`
        : `${event.pitch.letter} is not a chord tone here; classifying it needs non-chord-tone rules.`,
      providerId: GENERATOR_ID,
      providerVersion: GENERATOR_VERSION,
    };
    return {
      melodyEventId: event.id,
      harmonyEventIds: harmonyId ? [harmonyId] : [],
      role: member ? 'chord_tone' : 'unclassified',
      explanation: evidence.explanation ?? '',
      evidence: [evidence],
    };
  });

  const candidateEvidence: AnalysisEvidence[] = [
    {
      id: `${id}-ev-common-tones`,
      source: 'computed',
      featureId: 'common_tone_sum',
      value: commonToneSum,
      explanation: `${commonToneSum} tones are shared across consecutive chords (computed).`,
      providerId: GENERATOR_ID,
      providerVersion: GENERATOR_VERSION,
    },
  ];
  if (path.some((chord) => chord.key === 'd5raised')) {
    candidateEvidence.push({
      id: `${id}-ev-raised-seventh`,
      source: 'rule',
      featureId: 'raised_leading_tone',
      value: true,
      explanation: 'Major V in minor uses the conventionally raised leading tone (si).',
      providerId: GENERATOR_ID,
      providerVersion: GENERATOR_VERSION,
    });
  }

  const numerals = harmonyEvents.map((event) => event.analysis.romanNumeral);
  const title = numerals.length === 1 ? `${numerals[0]} held` : numerals.join(' → ');

  return {
    id,
    title,
    summary: 'Enumerated from chord-tone membership; ordered by shared tones.',
    tonalContext: context,
    phraseIntent,
    harmonyEvents,
    voicing: { soprano, alto, tenor, bass },
    melodyInterpretations,
    descriptors: [],
    evidence: candidateEvidence,
    provenance: {
      generatorId: GENERATOR_ID,
      generatorVersion: GENERATOR_VERSION,
      knowledgePackIds: [],
      fixtureAuthored: false,
    },
    derivability: DERIVABILITY_NOTES,
  };
}
