/* ---------- suggestion regeneration ---------- */

import { stampApproach } from '../../domain/approach';
import { withDerivedAnalysis } from '../../domain/derive-harmony';
import { resolveSuggestions, type SuggestionResolution } from '../../domain/suggest';
import type { WorkbenchState } from '../../domain/workbench-state';
import { listFixtures } from '../../fixtures/registry';
import { composeCandidateProse } from '../../knowledge/compose/composer';

/**
 * Apply a suggestion resolution WITHOUT disturbing the working reading: the
 * selected candidate survives every regeneration (the surface rule); only the
 * cards around it are replaced. Remapped locks from the resolution are merged
 * in, and locks pointing at candidates that no longer exist are pruned.
 */
function applyResolution(
  state: WorkbenchState,
  resolution: SuggestionResolution,
): WorkbenchState {
  const working =
    state.candidates.find((candidate) => candidate.id === state.selectedCandidateId) ?? null;
  if (resolution.kind === 'empty') {
    const candidates = working ? stampApproach([working], state.acceptedContext) : [];
    return {
      ...state,
      candidates,
      candidateSetId: null,
      selectedCandidateId: working?.id ?? null,
      suggestionStatus: candidates.length > 0 ? 'fresh' : 'empty',
      suggestionSource: working ? state.suggestionSource : null,
    };
  }
  // The working reading always leads; a suggestion with the same id is the
  // working reading's pristine twin and yields to the surface.
  const suggestions = resolution.candidates.filter(
    (candidate) => candidate.id !== working?.id,
  );
  // Stamping only sets `approach` — no note is touched, so the surface rule
  // holds for the working reading too.
  const candidates = stampApproach(
    working ? [working, ...suggestions] : resolution.candidates,
    state.acceptedContext,
  );
  const merged = resolution.locks
    ? [
        ...state.locks,
        ...resolution.locks.filter(
          (incoming) =>
            !state.locks.some(
              (existing) =>
                existing.candidateId === incoming.candidateId &&
                existing.targetId === incoming.targetId,
            ),
        ),
      ]
    : state.locks;
  const locks = merged.filter((lock) =>
    candidates.some((candidate) => candidate.id === lock.candidateId),
  );
  return {
    ...state,
    candidates,
    candidateSetId: resolution.candidateSetId,
    sourceFixtureId: resolution.sourceFixtureId,
    selectedCandidateId: working?.id ?? (resolution.candidates[0]?.id ?? null),
    suggestionStatus: 'fresh',
    suggestionSource: resolution.suggestionSource,
    boundaryConstraints: resolution.boundaryConstraints ?? state.boundaryConstraints,
    locks,
  };
}

/** Re-derive one candidate's analysis from its own notes (the surface rule),
 * then compose beginner prose from the fresh facts. */
export function deriveCandidate(
  state: WorkbenchState,
  candidateId: string | null,
): WorkbenchState {
  const index = state.candidates.findIndex((candidate) => candidate.id === candidateId);
  if (index === -1) return state;
  const derived = composeCandidateProse(
    withDerivedAnalysis(state.candidates[index], state.fragment, state.tonalContext),
  );
  return {
    ...state,
    candidates: state.candidates.map((candidate, i) => (i === index ? derived : candidate)),
  };
}

/** Compose prose for the resolution's computed candidates (authored pass through). */
function composeResolution(resolution: SuggestionResolution): SuggestionResolution {
  if (resolution.kind !== 'replace') return resolution;
  return { ...resolution, candidates: resolution.candidates.map(composeCandidateProse) };
}

export function regenerate(state: WorkbenchState): WorkbenchState {
  return applyResolution(
    state,
    composeResolution(
      resolveSuggestions({
        fragment: state.fragment,
        tonalContext: state.tonalContext,
        phraseIntent: state.phraseIntent,
        acceptedContext: state.acceptedContext,
        boundaryConstraints: state.boundaryConstraints,
        locks: state.locks,
        candidates: state.candidates,
        sourceFixtureId: state.sourceFixtureId,
        fixtures: listFixtures(),
      }),
    ),
  );
}
