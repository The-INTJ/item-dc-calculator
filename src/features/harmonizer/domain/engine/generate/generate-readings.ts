/* ---------------- the generator ---------------- */

import type { CandidatePath, RankingDimensions } from '../../analysis-types';
import type { ApproachContext } from '../../approach';
import type {
  BoundaryConstraint,
  MelodyFragment,
  PhraseIntent,
  TonalContext,
} from '../../music-types';
import { toTimelineSpan } from '../../timing';
import { DEFAULT_STYLE_PACK, type StylePack } from '../style';
import { buildCandidate } from './build-candidate';
import { enumerateChords, toVocabChord } from './enumerate';
import {
  approachVocabChord,
  classifyCadence,
  stepKey,
  type BeamPath,
  type LockedPitchConstraint,
} from './path-steps';
import { runStageABeam, stepOptionsFor } from './stage-a-beam';

const K_BEST = 8;
const PICK_COUNT = 3;

export interface GenerationRequest {
  fragment: MelodyFragment;
  context: TonalContext;
  phraseIntent: PhraseIntent;
  lockedPitches?: LockedPitchConstraint[];
  boundaryConstraints?: BoundaryConstraint[];
  approach?: ApproachContext | null;
  style?: StylePack;
}

/** Diversity: greedy max-difference pick (the POC's algorithm, kept). */
function pickDiverse<T extends BeamPath>(scored: T[]): T[] {
  const picked: T[] = [];
  while (picked.length < PICK_COUNT && picked.length < scored.length) {
    let best: T | null = null;
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
  return picked;
}

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
  const stepOptionsPerEvent = stepOptionsFor(events, spans, vocabulary, lockedPitches);
  const hasUnresolved = stepOptionsPerEvent.some((options) => options[0].kind === 'unresolved');

  // Stage A beam search.
  const approachChord = approachVocabChord(approach, vocabulary);
  const beam = runStageABeam(
    events,
    spans,
    stepOptionsPerEvent,
    vocabInfo,
    boundaryAfter,
    approachChord,
    melodyUsesLeadingTone,
    style,
  );
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
  const picked = pickDiverse(scored);

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
