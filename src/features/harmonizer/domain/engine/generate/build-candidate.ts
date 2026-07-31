/* ---------------- candidate assembly: one picked path → CandidatePath ---------------- */

import type { AnalysisEvidence, CandidatePath } from '../../analysis-types';
import type { ApproachContext } from '../../approach';
import type { MelodyFragment, PhraseIntent, TonalContext } from '../../music-types';
// metricStrengthAt: chord-change costs, unresolved-segment merging, and the
// second-inversion gate all read the 4/4 accent map — see the meter ledger in
// domain/timing.ts.
import { metricStrengthAt } from '../../timing';
import { annotateVoicing } from '../annotate';
import { makeEvidence } from '../evidence';
import type { CadenceType, StylePack } from '../style';
import type { ChordSegment } from './assignments';
import { ENGINE_DERIVABILITY_NOTES, ENGINE_SKETCH_DERIVABILITY_NOTES } from './derivability';
import { stepKey, type BeamPath, type LockedPitchConstraint, type PathStep } from './path-steps';
import { assembleVoicing } from './voicing-assembly';
import { runStageBBeam } from './voicing-search';

export const ENGINE_GENERATOR_ID = 'engine-generator';
export const ENGINE_GENERATOR_VERSION = '1.0.0';

export interface BuildInput {
  fragment: MelodyFragment;
  context: TonalContext;
  phraseIntent: PhraseIntent;
  spans: Array<{ start: number; units: number }>;
  lockedPitches: LockedPitchConstraint[];
  approach: ApproachContext | null;
  style: StylePack;
}

/**
 * Merge consecutive identical chords. A hole ABSORBS into the preceding
 * chord when it is explainable as ornamental motion (spec §21.1 step 3):
 * weak position, the melody note resolves by step into the next event, and
 * every pinned note in the span already belongs to that chord — the fa
 * nobody's chord contains becomes a passing tone over the held harmony
 * instead of a `?`. Unexplainable holes stay honest holes.
 */
function mergeSegments(
  steps: PathStep[],
  spans: Array<{ start: number; units: number }>,
  fragment: MelodyFragment,
): ChordSegment[] {
  const segments: ChordSegment[] = [];
  steps.forEach((step, eventIndex) => {
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
  return segments;
}

/** Evidence chips for one candidate: annotator facts plus path-level readings. */
function collectEvidence(
  id: string,
  path: BeamPath & { cadence: CadenceType | null },
  annotationEvidence: AnalysisEvidence[],
): AnalysisEvidence[] {
  const candidateEvidence: AnalysisEvidence[] = [...annotationEvidence];
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
  return candidateEvidence;
}

export function buildCandidate(
  path: BeamPath & { cadence: CadenceType | null },
  index: number,
  input: BuildInput,
): CandidatePath | null {
  const { fragment, context, phraseIntent, spans, lockedPitches, approach, style } = input;
  const id = `eng-${index}-${path.steps.map(stepKey).join('.')}`;
  // (sketchiness decided below, after hole absorption)

  const segments = mergeSegments(path.steps, spans, fragment);

  // Stage B beam over chord segments.
  const chordSegments = segments.filter((segment) => segment.step.kind === 'chord');
  const bestVoicing = runStageBBeam(chordSegments, fragment, context, lockedPitches, approach, style);
  if (bestVoicing === null) return null;

  // ---- assemble the SATB voicing ----
  const voicing = assembleVoicing(id, fragment, context, segments, chordSegments, bestVoicing.assignments);

  // ---- one analysis path: the same annotator as the surface ----
  const annotation = annotateVoicing(voicing, fragment, context, approach, id);

  const candidateEvidence = collectEvidence(id, path, annotation.evidence);

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
