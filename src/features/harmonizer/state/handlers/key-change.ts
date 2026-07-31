/**
 * Key change (EDIT_TONAL_CONTEXT): re-READ everything in the new key without
 * rewriting a single note.
 */

import type { TonalContext } from '../../domain/music-types';
import { respellAccepted, respellCandidate, respellFragment } from '../../domain/respell';
import type { WorkbenchState } from '../../domain/workbench-state';
import { pushHistory } from './history';
import { deriveCandidate, regenerate } from './suggestion-regeneration';

export function editTonalContext(
  state: WorkbenchState,
  tonalContext: TonalContext,
): WorkbenchState {
  const same =
    state.tonalContext.tonicPitchClass === tonalContext.tonicPitchClass &&
    state.tonalContext.tonic.letter === tonalContext.tonic.letter &&
    state.tonalContext.tonic.accidental === tonalContext.tonic.accidental &&
    state.tonalContext.mode === tonalContext.mode &&
    state.tonalContext.minorDoSystem === tonalContext.minorDoSystem;
  if (same) return state;
  // Key change re-READS everything and never rewrites a note: every pitch
  // stays byte-identical while its scaleDegree metadata (fragment, every
  // candidate's voicing, the accepted seam) is recomputed in the new key.
  // Applied fragments are deliberately untouched — each carries its own
  // tonalContext, so a mid-hymn key change is a feature, not corruption.
  const context = tonalContext;
  const next = {
    ...pushHistory(state),
    tonalContext: context,
    fragment: respellFragment(context, state.fragment),
    candidates: state.candidates.map((candidate) => respellCandidate(context, candidate)),
    acceptedContext: respellAccepted(context, state.acceptedContext),
  };
  return regenerate(deriveCandidate(next, next.selectedCandidateId));
}
