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
 *
 * When a span has NO chord in the naive vocabulary that contains every
 * sounding note (melody + pinned locks), the position does not fail — it
 * becomes an "unresolved" segment: the chord strip shows the sounding notes
 * with a `?` numeral, pinned notes stay in their lanes, the other lanes go
 * blank, and the derivability notes say which gaps need math versus custom
 * data. Showing the hole honestly is the point.
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
  MelodyFragment,
  PhraseIntent,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
  VoiceEvent,
  VoiceId,
} from './music-types';
import { diatonicPitch, scaleDegreeForPitchClass, syllableForDegree } from './scale';
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
  /** Lane the pinned note lives in — sketches render it there verbatim. */
  voice: VoiceId;
  /** The pinned note itself, shown when no chord fits around it. */
  pitch: SpelledPitch;
  scaleDegree?: VoiceEvent['scaleDegree'];
}

/** One position in a candidate path: a chosen chord, or an honest hole. */
type PathStep =
  | { kind: 'chord'; chord: EnumeratedChord }
  | { kind: 'unresolved'; eventIndex: number; locks: LockedPitchConstraint[] };

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

/** Notes for sketches with unresolved (`?`) segments. */
export const SKETCH_DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'needs_math',
    note: 'The ? spans have no chord in the naive diatonic vocabulary containing every sounding note. Once all four voices are chosen, naming the chord is pure math — a fuller vocabulary (sevenths, chromatic chords) would fill these.',
  },
  {
    aspect: 'voicing',
    status: 'needs_data',
    note: 'Blank lanes are left empty on purpose: filling them musically around pinned notes needs a voicing engine plus custom style data.',
  },
  {
    aspect: 'ranking',
    status: 'unsure',
    note: 'Ordered by shared tones only; musical preference needs style rules or data.',
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
  step: PathStep;
  startUnit: number;
  units: number;
  /** First melody-event index the segment covers (unresolved segments cover one). */
  eventIndex: number;
}

function commonTones(a: EnumeratedChord, b: EnumeratedChord): number {
  return a.pitchClasses.filter((pc) => b.pitchClasses.includes(pc)).length;
}

function stepKey(step: PathStep): string {
  return step.kind === 'chord' ? step.chord.key : `x${step.eventIndex}`;
}

/**
 * Enumerate skeleton candidates for a melody in a supported context. Returns
 * [] only when the context is unsupported or the fragment is empty — spans
 * where no chord satisfies the constraints become unresolved `?` segments
 * instead of failing.
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

  const stepOptionsPerEvent: PathStep[][] = events.map((event, index) => {
    const span = spans[index];
    const overlappingLocks = lockedPitches.filter(
      (lock) => lock.startUnit < span.start + span.units && span.start < lock.startUnit + lock.units,
    );
    const options = chords.filter(
      (chord) =>
        chord.pitchClasses.includes(event.pitch.pitchClass) &&
        overlappingLocks.every((lock) => chord.pitchClasses.includes(lock.pitchClass)),
    );
    if (options.length > 0) {
      return options.map((chord) => ({ kind: 'chord' as const, chord }));
    }
    return [{ kind: 'unresolved' as const, eventIndex: index, locks: overlappingLocks }];
  });
  const hasUnresolved = stepOptionsPerEvent.some((options) => options[0].kind === 'unresolved');

  // Depth-first cross product, capped — stable order keeps this deterministic.
  const rawPaths: PathStep[][] = [];
  const walk = (index: number, path: PathStep[]) => {
    if (rawPaths.length >= MAX_RAW_PATHS) return;
    if (index === events.length) {
      rawPaths.push([...path]);
      return;
    }
    for (const step of stepOptionsPerEvent[index]) {
      path.push(step);
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
      keySequence: path.map(stepKey).join('.'),
      commonToneSum: path.slice(1).reduce((sum, step, index) => {
        const previous = path[index];
        return step.kind === 'chord' && previous.kind === 'chord'
          ? sum + commonTones(previous.chord, step.chord)
          : sum;
      }, 0),
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
          entry.path.filter((step, index) => stepKey(chosen.path[index]) !== stepKey(step)).length,
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
      lockedPitches,
      hasUnresolved,
    }))
    .filter((candidate): candidate is CandidatePath => candidate !== null);
}

function buildSkeleton(
  path: PathStep[],
  commonToneSum: number,
  index: number,
  input: {
    fragment: MelodyFragment;
    context: TonalContext;
    phraseIntent: PhraseIntent;
    spans: Array<{ start: number; units: number }>;
    lockedPitches: LockedPitchConstraint[];
    hasUnresolved: boolean;
  },
): CandidatePath | null {
  const { fragment, context, phraseIntent, spans, lockedPitches, hasUnresolved } = input;
  const id = `gen-${index}-${path.map(stepKey).join('.')}`;

  // Merge consecutive identical chords into single harmony segments; unresolved
  // spans never merge — each stays its own visible hole.
  const segments: Segment[] = [];
  path.forEach((step, eventIndex) => {
    const span = spans[eventIndex];
    const last = segments[segments.length - 1];
    if (
      last &&
      last.step.kind === 'chord' &&
      step.kind === 'chord' &&
      last.step.chord.key === step.chord.key &&
      last.startUnit + last.units === span.start
    ) {
      last.units += span.units;
    } else {
      segments.push({ step, startUnit: span.start, units: span.units, eventIndex });
    }
  });

  // In sketch mode, lanes holding pinned notes render exactly those notes.
  const lockedVoices = new Set<VoiceId>(
    hasUnresolved ? lockedPitches.map((lock) => lock.voice) : [],
  );

  const harmonyEvents: HarmonyEvent[] = [];
  const alto: VoiceEvent[] = [];
  const tenor: VoiceEvent[] = [];
  const bass: VoiceEvent[] = [];
  const lanes: Record<'alto' | 'tenor' | 'bass', VoiceEvent[]> = { alto, tenor, bass };

  for (let s = 0; s < segments.length; s += 1) {
    const segment = segments[s];
    const harmonyId = `${id}-h${s}`;

    if (segment.step.kind === 'unresolved') {
      // The sounding set we actually know: melody note + pinned notes.
      const melodyEvent = fragment.events[segment.eventIndex];
      const tones: SpelledPitch[] = [];
      for (const tone of [melodyEvent.pitch, ...segment.step.locks.map((lock) => lock.pitch)]) {
        if (!tones.some((existing) => existing.midi === tone.midi)) tones.push(tone);
      }
      tones.sort((a, b) => a.midi - b.midi);
      const spelledTones: SpelledPitchClass[] = [];
      for (const tone of tones) {
        if (!spelledTones.some((existing) => existing.pitchClass === tone.pitchClass)) {
          spelledTones.push({
            letter: tone.letter,
            accidental: tone.accidental,
            pitchClass: tone.pitchClass,
          });
        }
      }
      const lowest = tones[0];
      const lowestLock = segment.step.locks.find((lock) => lock.pitch.midi === lowest.midi);
      const scaleDegreeRoot =
        lowest.midi === melodyEvent.pitch.midi
          ? melodyEvent.scaleDegree
          : (lowestLock?.scaleDegree ??
            scaleDegreeForPitchClass(context, lowest.pitchClass) ??
            melodyEvent.scaleDegree);
      harmonyEvents.push({
        id: harmonyId,
        start: unitsToTime(segment.startUnit),
        duration: unitsToDuration(segment.units),
        chord: {
          id: `gen-chord-${stepKey(segment.step)}`,
          root: spelledTones[0],
          pitchClasses: spelledTones.map((tone) => tone.pitchClass),
          spelledChordTones: spelledTones,
          quality: 'other',
        },
        analysis: {
          romanNumeral: '?',
          scaleDegreeRoot,
          functionTags: [],
        },
        inversion: 0,
        bassPitch: lowest,
        displaySymbol: tones
          .map((tone) => `${tone.letter}${tone.accidental === 'natural' ? '' : tone.accidental}`)
          .join('+'),
      });
      continue; // no naive voicing for a hole — the blank IS the information
    }

    const chord = segment.step.chord;
    const root = spellMember(context, chord.members[0]);
    const tones = chord.members.map((member) => spellMember(context, member));
    if (!root || tones.some((tone) => tone === null)) return null;

    const bassPitch = placeAbove(context, chord.members[0], 40); // >= E2 region
    const tenorPitch = bassPitch ? placeAbove(context, chord.members[1], bassPitch.midi + 1) : null;
    const altoPitch = tenorPitch ? placeAbove(context, chord.members[2], tenorPitch.midi + 1) : null;
    if (!bassPitch || !tenorPitch || !altoPitch) return null;

    const suffix = QUALITY_SUFFIX[chord.quality] ?? '';
    const accidentalText = root.accidental === 'natural' ? '' : root.accidental;
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
    if (!lockedVoices.has('bass')) bass.push(makeVoiceEvent('bass', bassPitch, chord.members[0]));
    if (!lockedVoices.has('tenor')) {
      tenor.push(makeVoiceEvent('tenor', tenorPitch, chord.members[1]));
    }
    if (!lockedVoices.has('alto')) alto.push(makeVoiceEvent('alto', altoPitch, chord.members[2]));
  }

  // Pinned notes render verbatim in their own lanes (sketch mode only).
  if (hasUnresolved) {
    lockedPitches.forEach((lock, lockIndex) => {
      if (lock.voice === 'soprano') return; // the melody lane is the melody
      const scaleDegree =
        lock.scaleDegree ??
        scaleDegreeForPitchClass(context, lock.pitchClass) ?? {
          degree: 1 as DiatonicDegree,
          chromaticOffset: 0,
          syllable: syllableForDegree(context, 1, 0) ?? 'do',
        };
      lanes[lock.voice].push({
        id: `${id}-locked-${lockIndex}`,
        voice: lock.voice,
        pitch: lock.pitch,
        scaleDegree,
        start: unitsToTime(lock.startUnit),
        duration: unitsToDuration(lock.units),
        tieFromPrevious: false,
      });
    });
    for (const lane of [alto, tenor, bass]) {
      lane.sort(
        (a, b) => toTimelineSpan(a.start, a.duration).startUnit - toTimelineSpan(b.start, b.duration).startUnit,
      );
    }
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
    const harmonyId = segment ? `${id}-h${segments.indexOf(segment)}` : '';
    if (segment?.step.kind === 'unresolved') {
      const pinned = segment.step.locks
        .map(
          (lock) => `${lock.pitch.letter}${lock.pitch.accidental === 'natural' ? '' : lock.pitch.accidental}`,
        )
        .join(', ');
      const evidence: AnalysisEvidence = {
        id: `${id}-int-${i}`,
        source: 'computed',
        featureId: 'lock_conflict',
        value: false,
        explanation: pinned
          ? `No chord in the naive vocabulary contains ${event.pitch.letter} together with the pinned ${pinned}; the sounding notes are shown as ?.`
          : `No chord in the naive vocabulary contains ${event.pitch.letter}; the sounding note is shown as ?.`,
        providerId: GENERATOR_ID,
        providerVersion: GENERATOR_VERSION,
      };
      return {
        melodyEventId: event.id,
        harmonyEventIds: harmonyId ? [harmonyId] : [],
        role: 'unclassified',
        explanation: evidence.explanation ?? '',
        evidence: [evidence],
      };
    }
    const member = segment?.step.chord.pitchClasses.includes(event.pitch.pitchClass) ?? false;
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
  const unresolvedCount = path.filter((step) => step.kind === 'unresolved').length;
  if (unresolvedCount > 0) {
    candidateEvidence.push({
      id: `${id}-ev-lock-conflict`,
      source: 'computed',
      featureId: 'lock_conflict',
      value: unresolvedCount,
      explanation: `${unresolvedCount} span(s) have no naive chord containing every sounding note — shown as ? with the notes that ARE known.`,
      providerId: GENERATOR_ID,
      providerVersion: GENERATOR_VERSION,
    });
  }
  if (path.some((step) => step.kind === 'chord' && step.chord.key === 'd5raised')) {
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
    summary: hasUnresolved
      ? 'Pinned notes kept. ? spans and blank lanes mark what the naive layer cannot derive — see the chips below.'
      : 'Enumerated from chord-tone membership; ordered by shared tones.',
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
    derivability: hasUnresolved ? SKETCH_DERIVABILITY_NOTES : DERIVABILITY_NOTES,
  };
}
