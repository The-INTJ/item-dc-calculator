/**
 * Live workbench state → persisted shape (the "save the notes, re-derive the
 * analysis" half of persistence v2). Split from project-store.ts — the store
 * owns storage I/O; this file owns the strip-down serialization.
 */

import type { CandidatePath } from '../domain/analysis-types';
import type {
  PersistedCandidate,
  PersistedWorkbench,
  WorkbenchState,
} from '../domain/workbench-state';

/** The Tier-1 strip: drop everything re-derivable from the notes. */
export function toPersistedCandidate(candidate: CandidatePath): PersistedCandidate {
  const {
    harmonyEvents: _harmony,
    melodyInterpretations: _interpretations,
    derivability: _derivability,
    approach: _approach,
    ...persisted
  } = candidate;
  return persisted;
}

export function toPersistedWorkbench(state: WorkbenchState): PersistedWorkbench {
  const working =
    state.candidates.find((candidate) => candidate.id === state.selectedCandidateId) ?? null;
  return {
    tonalContext: state.tonalContext,
    phraseIntent: state.phraseIntent,
    tempoBpm: state.tempoBpm,
    acceptedContext: state.acceptedContext,
    appliedFragments: state.appliedFragments.map((applied) => ({
      id: applied.id,
      fragment: applied.fragment,
      candidate: toPersistedCandidate(applied.candidate),
    })),
    fragment: state.fragment,
    boundaryConstraints: state.boundaryConstraints,
    sourceFixtureId: state.sourceFixtureId,
    workingCandidate: working ? toPersistedCandidate(working) : null,
    // Suggestion cards are not persisted; only locks on the working notes
    // mean anything after a reload.
    locks: state.locks.filter((lock) => lock.candidateId === working?.id),
    // Conditional spread: a null-selection corner save simply omits the key
    // (the schema is optional, not nullable).
    ...(state.selectedMeasureId ? { selectedMeasureId: state.selectedMeasureId } : {}),
  };
}
