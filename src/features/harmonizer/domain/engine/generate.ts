/**
 * The two-stage generator — real suggestions around the user's surface.
 *
 * Stage A chooses chord paths: per melody event, the vocabulary chords that
 * contain the melody note and every pinned note; a beam search scores paths
 * with style-pack costs (chord prevalence, directed progressions, harmonic
 * rhythm, gapped-melody weighting, cadence-by-intent — intent RANKS, never
 * filters). Boundary constraints partition the lattice: `hold` forbids a
 * change, `required` forbids continuing. The approach seam seeds the opening
 * transition. Spans no chord satisfies become honest holes, exactly like the
 * naive layer — showing the gap is the point.
 *
 * Stage B voices each chosen path: soprano fixed to the melody, bass/tenor/
 * alto enumerated over hymnal ranges ∩ chord tones ∩ doubling options, then a
 * beam DP scores transitions by style-weighted voice-leading facts plus
 * smoothness (semitone motion, common tones), seeded against the approach
 * voices. Locked notes are fixed assignments. Everything is deterministic:
 * content-derived ids, total tie-breaks, no randomness — safe in the reducer.
 */

import type { CandidatePath, RankingDimensions } from '../analysis-types';
import type { ApproachContext } from '../approach';
import type {
  BoundaryConstraint,
  ChordQuality,
  DiatonicDegree,
  MelodyFragment,
  PhraseIntent,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
  VoiceEvent,
  VoiceId,
} from '../music-types';
import { computeMidi } from '../pitch';
import { respellDegree, spellDegree } from '../scale';
import { metricStrengthAt, toTimelineSpan, unitsToDuration, unitsToTime } from '../timing';
import { annotateVoicing } from './annotate';
import { makeEvidence } from './evidence';
import type { AnalysisEvidence, DerivabilityNote } from '../analysis-types';
import { DEFAULT_STYLE_PACK, type CadenceType, type StylePack, type VocabChord } from './style';

export const ENGINE_GENERATOR_ID = 'engine-generator';
export const ENGINE_GENERATOR_VERSION = '1.0.0';

const STAGE_A_BEAM = 24;
const STAGE_B_BEAM = 40;
const K_BEST = 8;
const PICK_COUNT = 3;

/* ---------------- vocabulary ---------------- */

export interface DegreeMemberRef {
  degree: DiatonicDegree;
  chromaticOffset: number;
}

export interface EnumeratedChord {
  /** Stable key for ids and diversity comparison, e.g. "d5", "d5x7", "d5raised". */
  key: string;
  rootDegree: DiatonicDegree;
  romanNumeral: string;
  quality: ChordQuality;
  pitchClasses: number[];
  members: DegreeMemberRef[];
}

export interface LockedPitchConstraint {
  startUnit: number;
  units: number;
  pitchClass: number;
  voice: VoiceId;
  pitch: SpelledPitch;
  scaleDegree?: VoiceEvent['scaleDegree'];
}

const DEGREE_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

function wrapDegree(value: number): DiatonicDegree {
  return ((((value - 1) % 7) + 7) % 7 + 1) as DiatonicDegree;
}

function modeIntervals(context: TonalContext): number[] | null {
  if (context.mode === 'major') return [0, 2, 4, 5, 7, 9, 11];
  if (context.mode === 'natural_minor' && context.minorDoSystem === 'la_based') {
    return [0, 2, 3, 5, 7, 8, 10];
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

/**
 * The generation vocabulary: the seven diatonic triads, plus V7 in major, and
 * in la-based minor BOTH the modal minor v (already diatonic) and the
 * conventionally raised major V and V7 — labeled alternatives, per the
 * tradition. Null for unsupported contexts.
 */
export function enumerateChords(context: TonalContext): EnumeratedChord[] | null {
  const intervals = modeIntervals(context);
  if (!intervals) return null;
  const pcOf = (degree: DiatonicDegree, offset = 0) =>
    (((context.tonicPitchClass + intervals[degree - 1] + offset) % 12) + 12) % 12;

  const chords: EnumeratedChord[] = [];
  for (let d = 1 as DiatonicDegree; d <= 7; d = (d + 1) as DiatonicDegree) {
    const members: DegreeMemberRef[] = [d, wrapDegree(d + 2), wrapDegree(d + 4)].map((degree) => ({
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
    const members: DegreeMemberRef[] = [5, 7, 2, 4].map((value) => ({
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
    const raisedTriad: DegreeMemberRef[] = [
      { degree: 5, chromaticOffset: 0 },
      { degree: 7, chromaticOffset: 1 },
      { degree: 2, chromaticOffset: 0 },
    ];
    chords.push({
      key: 'd5raised',
      rootDegree: 5,
      romanNumeral: 'V',
      quality: 'major',
      pitchClasses: raisedTriad.map((member) => pcOf(member.degree, member.chromaticOffset)),
      members: raisedTriad,
    });
    const raisedSeventhChord: DegreeMemberRef[] = [
      { degree: 5, chromaticOffset: 0 },
      { degree: 7, chromaticOffset: 1 },
      { degree: 2, chromaticOffset: 0 },
      { degree: 4, chromaticOffset: 0 },
    ];
    chords.push({
      key: 'd5x7raised',
      rootDegree: 5,
      romanNumeral: 'V7',
      quality: 'dominant_seventh',
      pitchClasses: raisedSeventhChord.map((member) => pcOf(member.degree, member.chromaticOffset)),
      members: raisedSeventhChord,
    });
  }
  return chords;
}

function toVocabChord(chord: EnumeratedChord, context: TonalContext): VocabChord {
  const leadingPc = (context.tonicPitchClass + 11) % 12;
  return {
    key: chord.key,
    rootDegree: chord.rootDegree,
    raisedLeadingTone: chord.members.some(
      (member) => member.degree === 7 && member.chromaticOffset === 1,
    ),
    isSeventh: chord.members.length === 4,
    containsLeadingTone: chord.pitchClasses.includes(leadingPc),
  };
}

/* ---------------- stage A: chord paths ---------------- */

type PathStep =
  | { kind: 'chord'; chord: EnumeratedChord }
  | { kind: 'unresolved'; eventIndex: number; locks: LockedPitchConstraint[] };

function stepKey(step: PathStep): string {
  return step.kind === 'chord' ? step.chord.key : `x${step.eventIndex}`;
}

interface BeamPath {
  steps: PathStep[];
  cost: number;
  keySeq: string;
}

export interface GenerationRequest {
  fragment: MelodyFragment;
  context: TonalContext;
  phraseIntent: PhraseIntent;
  lockedPitches?: LockedPitchConstraint[];
  boundaryConstraints?: BoundaryConstraint[];
  approach?: ApproachContext | null;
  style?: StylePack;
}

function melodyRoleIn(chord: EnumeratedChord, pc: number): 'root' | 'third' | 'fifth' | 'seventh' {
  const index = chord.pitchClasses.indexOf(pc);
  if (index === 1) return 'third';
  if (index === 2) return 'fifth';
  if (index === 3) return 'seventh';
  return 'root';
}

function classifyCadence(penult: PathStep | undefined, final: PathStep): CadenceType | null {
  if (final.kind !== 'chord') return null;
  const finalDegree = final.chord.rootDegree;
  if (penult === undefined || penult.kind !== 'chord') {
    return finalDegree === 5 ? 'half' : null;
  }
  const penultDegree = penult.chord.rootDegree;
  if (penultDegree === 5 && finalDegree === 1) return 'authentic';
  if (finalDegree === 5 && penultDegree !== 5) return 'half';
  if (penultDegree === 4 && finalDegree === 1) return 'plagal';
  if (penultDegree === 5 && finalDegree === 6) return 'deceptive';
  return null;
}

/** The approach chord mapped into the vocabulary, when it fits. */
function approachVocabChord(
  approach: ApproachContext | null | undefined,
  vocabulary: EnumeratedChord[],
): EnumeratedChord | null {
  const harmony = approach?.harmony;
  if (!harmony) return null;
  return (
    vocabulary.find(
      (chord) =>
        chord.quality === harmony.chord.quality &&
        chord.pitchClasses[0] === harmony.chord.root.pitchClass,
    ) ?? null
  );
}

/* ---------------- stage B: voicing ---------------- */

interface ChordSegment {
  step: PathStep;
  startUnit: number;
  units: number;
  eventIndex: number;
}

interface Assignment {
  bass: SpelledPitch;
  tenor: SpelledPitch;
  alto: SpelledPitch;
  localCost: number;
  signature: string;
}

const VOICE_RANGES: Record<'bass' | 'tenor' | 'alto', { low: number; high: number }> = {
  bass: { low: 40, high: 60 },
  tenor: { low: 48, high: 67 },
  alto: { low: 55, high: 74 },
};

function placementsFor(
  context: TonalContext,
  member: DegreeMemberRef,
  range: { low: number; high: number },
): SpelledPitch[] {
  const spelled = spellDegree(context, member.degree, member.chromaticOffset);
  if (!spelled) return [];
  const placements: SpelledPitch[] = [];
  for (let octave = 1; octave <= 6; octave += 1) {
    const midi = computeMidi(spelled.letter, spelled.accidental, octave);
    if (midi >= range.low && midi <= range.high) {
      placements.push({ ...spelled, octave, midi });
    }
  }
  return placements;
}

/** Enumerate SATB completions of one chord under a fixed soprano. */
function assignmentsFor(
  context: TonalContext,
  chord: EnumeratedChord,
  sopranoMidi: number,
  sopranoPc: number,
  allowSecondInversion: boolean,
  locks: LockedPitchConstraint[],
  style: StylePack,
): Assignment[] {
  const leadingPc = (context.tonicPitchClass + 11) % 12;
  const bassMembers: DegreeMemberRef[] = [chord.members[0]];
  if (chord.members.length === 3 || chord.members.length === 4) {
    bassMembers.push(chord.members[1]); // first inversion
  }
  if (allowSecondInversion && chord.members.length === 3) {
    bassMembers.push(chord.members[2]); // cadential six-four only
  }

  const lockFor = (voice: 'bass' | 'tenor' | 'alto') =>
    locks.find((lock) => lock.voice === voice) ?? null;
  const bassLock = lockFor('bass');
  // A locked bass fixes the pitch outright — one iteration, no member choice.
  const effectiveBassMembers = bassLock ? [bassMembers[0]] : bassMembers;

  const results: Assignment[] = [];
  for (const bassMember of effectiveBassMembers) {
    const bassOptions = bassLock
      ? [bassLock.pitch]
      : placementsFor(context, bassMember, VOICE_RANGES.bass);
    for (const bass of bassOptions) {
      for (const tenorMember of chord.members) {
        const tenorLock = lockFor('tenor');
        const tenorOptions = tenorLock
          ? [tenorLock.pitch]
          : placementsFor(context, tenorMember, VOICE_RANGES.tenor);
        for (const tenor of tenorOptions) {
          if (tenor.midi < bass.midi) continue;
          for (const altoMember of chord.members) {
            const altoLock = lockFor('alto');
            const altoOptions = altoLock
              ? [altoLock.pitch]
              : placementsFor(context, altoMember, VOICE_RANGES.alto);
            for (const alto of altoOptions) {
              if (alto.midi < tenor.midi || alto.midi > sopranoMidi) continue;
              if (alto.midi - tenor.midi > 12) continue;
              if (sopranoMidi - alto.midi > 12) continue;

              // Completeness + doubling.
              const pcs = new Set([bass.pitchClass, tenor.pitchClass, alto.pitchClass, sopranoPc]);
              let localCost = 0;
              const root = chord.pitchClasses[0];
              const third = chord.pitchClasses[1];
              const fifth = chord.pitchClasses[2];
              if (!pcs.has(root)) localCost += 2.5; // a chord without its root is another chord
              if (!pcs.has(third)) localCost += 2; // a chord without its third barely speaks
              if (!pcs.has(fifth)) localCost += chord.members.length === 4 ? 0.1 : 0.3;
              if (chord.members.length === 4 && !pcs.has(chord.pitchClasses[3])) localCost += 2;
              // Hymnal settings sit mostly in root position (corpus ≈ 55–58%).
              if (bass.pitchClass !== root) localCost += 0.35;
              const leadingCount = [bass, tenor, alto].filter(
                (pitch) => pitch.pitchClass === leadingPc,
              ).length + (sopranoPc === leadingPc ? 1 : 0);
              if (leadingCount >= 2) localCost += style.voiceLeadingCost('doubled_leading_tone');

              results.push({
                bass,
                tenor,
                alto,
                localCost,
                signature: `${bass.midi}.${tenor.midi}.${alto.midi}`,
              });
            }
          }
        }
      }
    }
  }
  results.sort((a, b) => a.localCost - b.localCost || a.signature.localeCompare(b.signature));
  return results.slice(0, STAGE_B_BEAM);
}

function transitionCost(
  previous: Assignment | { bass: SpelledPitch; tenor: SpelledPitch; alto: SpelledPitch },
  current: Assignment,
  previousSopranoMidi: number,
  sopranoMidi: number,
  style: StylePack,
): number {
  let cost = 0;
  const voices: Array<[number, number]> = [
    [sopranoMidi, previousSopranoMidi],
    [current.alto.midi, previous.alto.midi],
    [current.tenor.midi, previous.tenor.midi],
    [current.bass.midi, previous.bass.midi],
  ];
  // Parallels between every pair.
  for (let i = 0; i < voices.length; i += 1) {
    for (let j = i + 1; j < voices.length; j += 1) {
      const [aNow, aWas] = voices[i];
      const [bNow, bWas] = voices[j];
      if (aNow === aWas || bNow === bWas) continue;
      const wasInterval = Math.abs(aWas - bWas) % 12;
      const nowInterval = Math.abs(aNow - bNow) % 12;
      if (wasInterval === nowInterval && (nowInterval === 7 || nowInterval === 0)) {
        cost += style.voiceLeadingCost(
          nowInterval === 7 ? 'parallel_perfect_fifths' : 'parallel_octaves',
        );
      }
    }
  }
  // Smoothness over the inner voices and bass.
  let motion = 0;
  let commonTones = 0;
  for (const [now, was] of voices.slice(1)) {
    motion += Math.abs(now - was);
    if (now === was) commonTones += 1;
  }
  cost += motion * style.smoothness.semitoneCost;
  cost -= commonTones * style.smoothness.commonToneBonus;
  return cost;
}

/* ---------------- derivability ---------------- */

export const ENGINE_DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'computed',
    note: 'Chord choices are computed from note membership, directed progression weights, and cadence tables.',
  },
  {
    aspect: 'voicing',
    status: 'computed',
    note: 'Voiced under hymnal ranges, spacing, and doubling; smoothness and voice-leading weighed by the style pack.',
  },
  {
    aspect: 'ranking',
    status: 'computed',
    note: 'Ordered by separate dimensions (intent match, melodic fit, voice-leading ease) weighted by the style pack — never one score.',
  },
  {
    aspect: 'interpretation',
    status: 'computed',
    note: 'Passing tones, neighbor tones, and suspensions classified by rule; unclear readings say so.',
  },
  {
    aspect: 'effects',
    status: 'needs_data',
    note: 'Feel and effect labels are curated content; nothing to compute here.',
  },
];

export const ENGINE_SKETCH_DERIVABILITY_NOTES: DerivabilityNote[] = [
  {
    aspect: 'chord_path',
    status: 'needs_math',
    note: 'The ? spans have no chord in the style vocabulary containing every sounding note. Naming a full sonority is always math; a wider vocabulary would fill these.',
  },
  {
    aspect: 'voicing',
    status: 'needs_data',
    note: 'Blank lanes are left empty on purpose: filling them musically around pinned notes needs the wider vocabulary first.',
  },
  {
    aspect: 'ranking',
    status: 'computed',
    note: 'Resolvable spans are ranked normally; holes carry a fixed honesty cost.',
  },
  {
    aspect: 'interpretation',
    status: 'computed',
    note: 'Classified where a chord exists; ? spans have no chord to measure against.',
  },
  {
    aspect: 'effects',
    status: 'needs_data',
    note: 'Feel and effect labels are curated content; nothing to compute here.',
  },
];

/* ---------------- the generator ---------------- */

export function generateReadings(request: GenerationRequest): CandidatePath[] {
  const {
    fragment,
    context,
    phraseIntent,
    lockedPitches = [],
    boundaryConstraints = [],
    approach = null,
  } = request;
  const style = request.style ?? DEFAULT_STYLE_PACK;
  const vocabulary = enumerateChords(context);
  const events = fragment.events;
  if (!vocabulary || events.length === 0) return [];

  const spans = events.map((event) => {
    const span = toTimelineSpan(event.start, event.duration);
    return { start: span.startUnit - 1, units: span.spanUnits };
  });
  const vocabInfo = new Map(vocabulary.map((chord) => [chord.key, toVocabChord(chord, context)]));
  const leadingPc = (context.tonicPitchClass + 11) % 12;
  const melodyUsesLeadingTone = events.some((event) => event.pitch.pitchClass === leadingPc);
  const boundaryAfter = new Map(
    boundaryConstraints.map((constraint) => [constraint.afterMelodyEventId, constraint.policy]),
  );

  // Step options per event.
  const stepOptionsPerEvent: PathStep[][] = events.map((event, index) => {
    const span = spans[index];
    const overlappingLocks = lockedPitches.filter(
      (lock) => lock.startUnit < span.start + span.units && span.start < lock.startUnit + lock.units,
    );
    const options = vocabulary.filter(
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

  // Stage A beam search.
  const approachChord = approachVocabChord(approach, vocabulary);
  let beam: BeamPath[] = [{ steps: [], cost: 0, keySeq: '' }];
  events.forEach((event, index) => {
    const nextBeam: BeamPath[] = [];
    const changeStrength = metricStrengthAt(spans[index].start);
    const policy =
      index > 0 ? (boundaryAfter.get(events[index - 1].id) ?? 'allowed') : 'allowed';
    for (const path of beam) {
      const previousStep = path.steps[path.steps.length - 1];
      for (const step of stepOptionsPerEvent[index]) {
        let cost = path.cost;
        if (step.kind === 'chord') {
          const info = vocabInfo.get(step.chord.key)!;
          cost += style.emissionCost(melodyRoleIn(step.chord, event.pitch.pitchClass));
          cost += style.gappedMelodyCost(info, melodyUsesLeadingTone);
          if (previousStep === undefined) {
            const from = approachChord ? vocabInfo.get(approachChord.key)! : null;
            cost += style.transitionCost(from, info);
          } else if (previousStep.kind === 'chord') {
            const same = previousStep.chord.key === step.chord.key;
            if (policy === 'hold' && !same) continue;
            if (policy === 'required' && same) continue;
            cost += style.transitionCost(vocabInfo.get(previousStep.chord.key)!, info);
            if (!same) cost += style.harmonicRhythmCost(changeStrength);
          } else {
            cost += style.transitionCost(null, info);
          }
        } else {
          cost += 5; // the honesty cost of a hole
        }
        nextBeam.push({
          steps: [...path.steps, step],
          cost,
          keySeq: path.keySeq === '' ? stepKey(step) : `${path.keySeq}.${stepKey(step)}`,
        });
      }
    }
    nextBeam.sort((a, b) => a.cost - b.cost || a.keySeq.localeCompare(b.keySeq));
    beam = nextBeam.slice(0, STAGE_A_BEAM);
  });
  if (beam.length === 0) return [];

  // Cadence cost at the close.
  const scored = beam
    .map((path) => {
      const cadence = classifyCadence(path.steps[path.steps.length - 2], path.steps[path.steps.length - 1]);
      return {
        ...path,
        cadence,
        cost: path.cost + style.cadenceCost(phraseIntent, cadence),
      };
    })
    .sort((a, b) => a.cost - b.cost || a.keySeq.localeCompare(b.keySeq))
    .slice(0, K_BEST);

  // Diversity: greedy max-difference pick (the POC's algorithm, kept).
  const picked: typeof scored = [];
  while (picked.length < PICK_COUNT && picked.length < scored.length) {
    let best: (typeof scored)[number] | null = null;
    let bestDifference = -1;
    for (const entry of scored) {
      if (picked.includes(entry)) continue;
      const difference = picked.reduce(
        (sum, chosen) =>
          sum +
          entry.steps.filter((step, index) => stepKey(chosen.steps[index]) !== stepKey(step)).length,
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

  // Stage B + assembly per picked path.
  void hasUnresolved; // per-candidate sketchiness is decided after absorption
  const candidates = picked
    .map((path, index) =>
      buildCandidate(path, index, {
        fragment,
        context,
        phraseIntent,
        spans,
        lockedPitches,
        approach,
        style,
      }),
    )
    .filter((candidate): candidate is CandidatePath => candidate !== null);

  // Ranking dimensions, normalized within the set (1 = best), never averaged.
  const cadences = picked.map((path) => style.cadenceCost(phraseIntent, path.cadence));
  const totals = picked.map((path) => path.cost);
  const normalize = (values: number[], value: number) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return max === min ? 1 : 1 - (value - min) / (max - min);
  };
  return candidates.map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
    rankingDimensions: {
      intentMatch: normalize(cadences, cadences[index]),
      melodicFit: normalize(totals, totals[index]),
      voiceLeadingEase: candidate.rankingDimensions?.voiceLeadingEase ?? 1,
    } satisfies RankingDimensions,
  }));
}

interface BuildInput {
  fragment: MelodyFragment;
  context: TonalContext;
  phraseIntent: PhraseIntent;
  spans: Array<{ start: number; units: number }>;
  lockedPitches: LockedPitchConstraint[];
  approach: ApproachContext | null;
  style: StylePack;
}

function buildCandidate(
  path: BeamPath & { cadence: CadenceType | null },
  index: number,
  input: BuildInput,
): CandidatePath | null {
  const { fragment, context, phraseIntent, spans, lockedPitches, approach, style } = input;
  const id = `eng-${index}-${path.steps.map(stepKey).join('.')}`;
  // (sketchiness decided below, after hole absorption)

  // Merge consecutive identical chords. A hole ABSORBS into the preceding
  // chord when it is explainable as ornamental motion (spec §21.1 step 3):
  // weak position, the melody note resolves by step into the next event, and
  // every pinned note in the span already belongs to that chord — the fa
  // nobody's chord contains becomes a passing tone over the held harmony
  // instead of a `?`. Unexplainable holes stay honest holes.
  const segments: ChordSegment[] = [];
  path.steps.forEach((step, eventIndex) => {
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
      return;
    }
    if (
      step.kind === 'unresolved' &&
      last &&
      last.step.kind === 'chord' &&
      last.startUnit + last.units === span.start &&
      metricStrengthAt(span.start) !== 'strong'
    ) {
      const chord = last.step.chord;
      const melodyEvent = fragment.events[eventIndex];
      const nextEvent = fragment.events[eventIndex + 1] ?? null;
      const melodyResolves =
        nextEvent !== null &&
        Math.abs(nextEvent.pitch.midi - melodyEvent.pitch.midi) >= 1 &&
        Math.abs(nextEvent.pitch.midi - melodyEvent.pitch.midi) <= 2;
      const locksExplained = step.locks.every((lock) =>
        chord.pitchClasses.includes(lock.pitchClass),
      );
      if (melodyResolves && locksExplained) {
        last.units += span.units;
        return;
      }
    }
    segments.push({ step, startUnit: span.start, units: span.units, eventIndex });
  });

  // Stage B beam over chord segments.
  const chordSegments = segments.filter((segment) => segment.step.kind === 'chord');
  interface BeamState {
    assignments: Assignment[];
    cost: number;
    signature: string;
  }
  let states: BeamState[] = [{ assignments: [], cost: 0, signature: '' }];
  let stageBFailed = false;
  chordSegments.forEach((segment, segmentIndex) => {
    if (stageBFailed) return;
    const chord = (segment.step as Extract<PathStep, { kind: 'chord' }>).chord;
    const melodyEvent = fragment.events[segment.eventIndex];
    const nextChordSegment = chordSegments[segmentIndex + 1];
    const allowSecondInversion =
      chord.rootDegree === 1 &&
      nextChordSegment !== undefined &&
      (nextChordSegment.step as Extract<PathStep, { kind: 'chord' }>).chord.rootDegree === 5 &&
      metricStrengthAt(segment.startUnit) !== 'weak';
    const segmentLocks = lockedPitches.filter(
      (lock) =>
        lock.voice !== 'soprano' &&
        lock.startUnit < segment.startUnit + segment.units &&
        segment.startUnit < lock.startUnit + lock.units,
    );
    const options = assignmentsFor(
      context,
      chord,
      melodyEvent.pitch.midi,
      melodyEvent.pitch.pitchClass,
      allowSecondInversion,
      segmentLocks,
      style,
    );
    if (options.length === 0) {
      stageBFailed = true;
      return;
    }
    // A hole between two chord segments breaks voice-leading continuity — no
    // transition cost is charged across it.
    const previousChordSegment = segmentIndex > 0 ? chordSegments[segmentIndex - 1] : null;
    const contiguous =
      previousChordSegment !== null &&
      previousChordSegment.startUnit + previousChordSegment.units === segment.startUnit;
    const previousMelody = contiguous
      ? fragment.events[previousChordSegment.eventIndex]
      : null;
    const nextStates: BeamState[] = [];
    for (const state of states) {
      const previousAssignment = state.assignments[state.assignments.length - 1] ?? null;
      for (const option of options) {
        let cost = state.cost + option.localCost;
        if (previousAssignment && previousMelody) {
          cost += transitionCost(
            previousAssignment,
            option,
            previousMelody.pitch.midi,
            fragment.events[segment.eventIndex].pitch.midi,
            style,
          );
        } else if (!previousAssignment && approach?.voices) {
          const seam = approach.voices;
          let motion = 0;
          if (seam.alto) motion += Math.abs(option.alto.midi - seam.alto.pitch.midi);
          if (seam.tenor) motion += Math.abs(option.tenor.midi - seam.tenor.pitch.midi);
          if (seam.bass) motion += Math.abs(option.bass.midi - seam.bass.pitch.midi);
          cost += motion * style.smoothness.semitoneCost;
        }
        nextStates.push({
          assignments: [...state.assignments, option],
          cost,
          signature: `${state.signature}|${option.signature}`,
        });
      }
    }
    nextStates.sort((a, b) => a.cost - b.cost || a.signature.localeCompare(b.signature));
    states = nextStates.slice(0, STAGE_B_BEAM);
  });
  if (stageBFailed || states.length === 0) return null;
  const bestVoicing = states[0];

  // ---- assemble the SATB voicing ----
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
    const assignment = bestVoicing.assignments[segmentIndex];
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
  // Contiguous same-pitch events merge into one held note — a congregation
  // does not re-articulate a common tone, and a pinned whole note that spans
  // several segments stays ONE note (lock badges re-map onto it verbatim).
  const mergeHeldNotes = (lane: VoiceEvent[]): VoiceEvent[] => {
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
  };
  const voicing = {
    soprano,
    alto: mergeHeldNotes(alto),
    tenor: mergeHeldNotes(tenor),
    bass: mergeHeldNotes(bass),
  };

  // ---- one analysis path: the same annotator as the surface ----
  const annotation = annotateVoicing(voicing, fragment, context, approach, id);

  const candidateEvidence: AnalysisEvidence[] = [...annotation.evidence];
  const chordSteps = path.steps.filter(
    (step): step is Extract<PathStep, { kind: 'chord' }> => step.kind === 'chord',
  );
  const commonToneSum = chordSteps.slice(1).reduce((sum, step, i) => {
    const previous = chordSteps[i];
    return (
      sum + step.chord.pitchClasses.filter((pc) => previous.chord.pitchClasses.includes(pc)).length
    );
  }, 0);
  candidateEvidence.push(
    makeEvidence(
      `${id}-ev-common-tones`,
      'common_tone_sum',
      commonToneSum,
      `${commonToneSum} tones are shared across consecutive chords.`,
    ),
  );
  if (chordSteps.some((step) => step.chord.key === 'd5raised' || step.chord.key === 'd5x7raised')) {
    candidateEvidence.push({
      ...makeEvidence(
        `${id}-ev-raised-seventh`,
        'raised_leading_tone',
        true,
        'Major V in minor uses the conventionally raised leading tone (si).',
      ),
      source: 'rule',
    });
  }
  for (let i = 1; i < chordSteps.length; i += 1) {
    if (chordSteps[i - 1].chord.rootDegree === 5 && chordSteps[i].chord.rootDegree === 4) {
      candidateEvidence.push(
        makeEvidence(
          `${id}-ev-retrogression-${i}`,
          'retrogression',
          'V→IV',
          'The dominant steps back to the subdominant — a retrogression the old folk harmonizations allow.',
        ),
      );
      break;
    }
  }
  if (path.cadence) {
    candidateEvidence.push(
      makeEvidence(
        `${id}-ev-cadence`,
        'cadence_reading',
        path.cadence,
        `The close reads as a ${path.cadence} cadence.`,
      ),
    );
  }
  const unresolvedCount = path.steps.filter((step) => step.kind === 'unresolved').length;
  if (unresolvedCount > 0) {
    candidateEvidence.push(
      makeEvidence(
        `${id}-ev-lock-conflict`,
        'lock_conflict',
        unresolvedCount,
        `${unresolvedCount} span(s) have no vocabulary chord containing every sounding note — shown as ? with the notes that ARE known.`,
      ),
    );
  }

  const hasUnresolved = segments.some((segment) => segment.step.kind === 'unresolved');

  const numerals = annotation.harmonyEvents
    .map((event) => event.analysis.romanNumeral)
    .filter((numeral, i, all) => i === 0 || numeral !== all[i - 1]);
  const title = numerals.length === 1 ? `${numerals[0]} held` : numerals.join(' → ');

  // Voice-leading ease from the stage-B cost, normalized later by the caller.
  const stageBCost = bestVoicing.cost;

  return {
    id,
    title,
    summary: hasUnresolved
      ? 'Pinned notes kept. ? spans and blank lanes mark what the vocabulary cannot cover — see the chips below.'
      : 'Generated around your melody: chords weighed by hymn practice, voices led for singability.',
    tonalContext: context,
    phraseIntent,
    harmonyEvents: annotation.harmonyEvents,
    voicing,
    melodyInterpretations: annotation.melodyInterpretations,
    descriptors: [],
    evidence: candidateEvidence,
    rankingDimensions: { voiceLeadingEase: 1 / (1 + Math.max(0, stageBCost)) },
    provenance: {
      generatorId: ENGINE_GENERATOR_ID,
      generatorVersion: ENGINE_GENERATOR_VERSION,
      knowledgePackIds: [`${style.id}@${style.version}`],
      fixtureAuthored: false,
    },
    derivability: hasUnresolved ? ENGINE_SKETCH_DERIVABILITY_NOTES : ENGINE_DERIVABILITY_NOTES,
  };
}
