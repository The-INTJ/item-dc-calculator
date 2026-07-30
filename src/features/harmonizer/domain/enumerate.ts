/**
 * Thin adapter over the engine generator (domain/engine/generate.ts) — the
 * naive skeleton enumerator this module used to hand-roll is retired. The
 * module name and its exports survive so call sites and tests keep one
 * import path; the honesty contract survives with them: spans no vocabulary
 * chord satisfies become `?` holes with pinned notes kept in their lanes,
 * never a dead end.
 */

import type { CandidatePath } from './analysis-types';
import type { ApproachContext } from './approach';
import type {
  BoundaryConstraint,
  MelodyFragment,
  PhraseIntent,
  TonalContext,
} from './music-types';
import {
  ENGINE_DERIVABILITY_NOTES,
  ENGINE_SKETCH_DERIVABILITY_NOTES,
  enumerateChords,
  generateReadings,
  type EnumeratedChord,
  type LockedPitchConstraint,
} from './engine/generate';
import { DEFAULT_STYLE_PACK, type StylePack } from './engine/style';

export {
  ENGINE_DERIVABILITY_NOTES as DERIVABILITY_NOTES,
  ENGINE_SKETCH_DERIVABILITY_NOTES as SKETCH_DERIVABILITY_NOTES,
  enumerateChords,
};
export type { EnumeratedChord, LockedPitchConstraint };

/**
 * Generate suggestion candidates around the melody. Returns [] only when the
 * context is unsupported or the fragment is empty.
 */
export function assembleSkeletons(
  fragment: MelodyFragment,
  context: TonalContext,
  phraseIntent: PhraseIntent,
  lockedPitches: LockedPitchConstraint[] = [],
  boundaryConstraints: BoundaryConstraint[] = [],
  approach: ApproachContext | null = null,
  style: StylePack = DEFAULT_STYLE_PACK,
): CandidatePath[] {
  return generateReadings({
    fragment,
    context,
    phraseIntent,
    lockedPitches,
    boundaryConstraints,
    approach,
    style,
  });
}
