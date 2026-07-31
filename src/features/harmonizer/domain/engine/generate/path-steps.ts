/* ---------------- stage A: chord paths ---------------- */

import type { ApproachContext } from '../../approach';
import type { SpelledPitch, VoiceEvent, VoiceId } from '../../music-types';
import type { CadenceType } from '../style';
import type { EnumeratedChord } from './enumerate';

export interface LockedPitchConstraint {
  startUnit: number;
  units: number;
  pitchClass: number;
  voice: VoiceId;
  pitch: SpelledPitch;
  scaleDegree?: VoiceEvent['scaleDegree'];
}

export type PathStep =
  | { kind: 'chord'; chord: EnumeratedChord }
  | { kind: 'unresolved'; eventIndex: number; locks: LockedPitchConstraint[] };

export function stepKey(step: PathStep): string {
  return step.kind === 'chord' ? step.chord.key : `x${step.eventIndex}`;
}

export interface BeamPath {
  steps: PathStep[];
  cost: number;
  keySeq: string;
}

export function melodyRoleIn(
  chord: EnumeratedChord,
  pc: number,
): 'root' | 'third' | 'fifth' | 'seventh' {
  const index = chord.pitchClasses.indexOf(pc);
  if (index === 1) return 'third';
  if (index === 2) return 'fifth';
  if (index === 3) return 'seventh';
  return 'root';
}

export function classifyCadence(penult: PathStep | undefined, final: PathStep): CadenceType | null {
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
export function approachVocabChord(
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
