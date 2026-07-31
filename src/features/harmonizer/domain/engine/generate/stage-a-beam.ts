/* ---------------- stage A: beam search over chord paths ---------------- */

import type { BoundaryConstraint, MelodyFragment } from '../../music-types';
// metricStrengthAt: chord-change costs, unresolved-segment merging, and the
// second-inversion gate all read the 4/4 accent map — see the meter ledger in
// domain/timing.ts.
import { metricStrengthAt } from '../../timing';
import type { StylePack, VocabChord } from '../style';
import type { EnumeratedChord } from './enumerate';
import {
  melodyRoleIn,
  stepKey,
  type BeamPath,
  type LockedPitchConstraint,
  type PathStep,
} from './path-steps';

const STAGE_A_BEAM = 24;

/** Step options per event: vocabulary chords covering melody + pinned notes, else an honest hole. */
export function stepOptionsFor(
  events: MelodyFragment['events'],
  spans: Array<{ start: number; units: number }>,
  vocabulary: EnumeratedChord[],
  lockedPitches: LockedPitchConstraint[],
): PathStep[][] {
  return events.map((event, index) => {
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
}

/** Stage A beam search over chord paths. */
export function runStageABeam(
  events: MelodyFragment['events'],
  spans: Array<{ start: number; units: number }>,
  stepOptionsPerEvent: PathStep[][],
  vocabInfo: Map<string, VocabChord>,
  boundaryAfter: Map<string, BoundaryConstraint['policy']>,
  approachChord: EnumeratedChord | null,
  melodyUsesLeadingTone: boolean,
  style: StylePack,
): BeamPath[] {
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
  return beam;
}
