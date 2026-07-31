/* ---------------- stage B: beam DP over chord segments ---------------- */

import type { ApproachContext } from '../../approach';
import type { MelodyFragment, TonalContext } from '../../music-types';
import { metricStrengthAt } from '../../timing';
import type { StylePack } from '../style';
import { assignmentsFor, STAGE_B_BEAM, type Assignment, type ChordSegment } from './assignments';
import type { LockedPitchConstraint, PathStep } from './path-steps';
import { transitionCost } from './transition-cost';

export interface BeamState {
  assignments: Assignment[];
  cost: number;
  signature: string;
}

/** Run the Stage B beam; null when some segment admits no assignment. */
export function runStageBBeam(
  chordSegments: ChordSegment[],
  fragment: MelodyFragment,
  context: TonalContext,
  lockedPitches: LockedPitchConstraint[],
  approach: ApproachContext | null,
  style: StylePack,
): BeamState | null {
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
    // Soprano locks are filtered here because the soprano is the generator's
    // melodic anchor — it is fixed to the fragment by construction, so a
    // soprano lock is trivially satisfied. In the UI a soprano lock still
    // freezes the note against editing (nothing defaults locked, all four
    // voices carry live lock toggles); anchoring stays soprano until the
    // melody-in-tenor option (deferred) re-parameterizes Stage B.
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
  return states[0];
}
