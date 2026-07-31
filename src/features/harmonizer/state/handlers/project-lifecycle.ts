/**
 * Project lifecycle: the initial workbench state, loading samples into the
 * selected measure, and persistence-v2 rehydration of saved projects.
 */

import { stampApproach } from '../../domain/approach';
import type { HarmonizationFixture } from '../../domain/fixture-types';
import { acceptedHarmonySignature } from '../../domain/signatures';
import { defaultCandidateSet } from '../../domain/suggest';
import type {
  AcceptedContext,
  PersistedAppliedFragment,
  PersistedCandidate,
  WorkbenchState,
} from '../../domain/workbench-state';
import type { CandidatePath } from '../../domain/analysis-types';
import { annotateVoicing } from '../../domain/engine/annotate';
import type { WorkbenchAction } from '../actions';
import { pushHistory } from './history';
import { acceptedContextForIndex } from './measure-list';
import { deriveCandidate, regenerate } from './suggestion-regeneration';

export function createInitialWorkbenchState(fixture: HarmonizationFixture): WorkbenchState {
  const candidateSet =
    fixture.candidateSets.find((set) => set.id === 'default') ?? fixture.candidateSets[0];
  const candidates = candidateSet
    ? stampApproach(candidateSet.candidates, fixture.initialState.acceptedContext)
    : [];
  const first = candidates[0] ?? null;
  // Deterministic measure id (reducer purity — no crypto): the `measure-`
  // prefix cannot collide with caller-minted entry ids.
  const measureId = first ? `measure-${fixture.initialState.fragment.id}` : null;
  return {
    tonalContext: fixture.initialState.tonalContext,
    phraseIntent: fixture.initialState.phraseIntent,
    tempoBpm: fixture.initialState.tempoBpm,
    acceptedContext: fixture.initialState.acceptedContext,
    // The working fragment IS the hymn's first measure, selected from the
    // start. (Spec §10.1's "preview-selected, not applied" distinction
    // dissolved with the unified measure list.) Entry fields share references
    // with fragment/candidates[0] so the sync wrapper short-circuits.
    appliedFragments:
      first && measureId
        ? [{ id: measureId, fragment: fixture.initialState.fragment, candidate: first }]
        : [],
    fragment: fixture.initialState.fragment,
    boundaryConstraints: fixture.initialState.boundaryConstraints,
    suggestionStatus: candidates.length > 0 ? 'fresh' : 'empty',
    suggestionSource: candidates.length > 0 ? 'authored' : null,
    sourceFixtureId: fixture.id,
    candidateSetId: candidateSet ? candidateSet.id : null,
    candidates,
    selectedCandidateId: first ? first.id : null,
    locks: [],
    playback: { status: 'idle' },
    history: [],
    future: [],
    lastGestureId: null,
    selectedMeasureId: measureId,
  };
}

export function loadSample(
  state: WorkbenchState,
  action: Extract<WorkbenchAction, { type: 'LOAD_SAMPLE' }>,
): WorkbenchState {
  // The sample loads INTO the selected measure — selection survives, and
  // the write-through sync mirrors the sample's reading onto its pill.
  const base = pushHistory(state);
  const selectedIndex = state.selectedMeasureId
    ? state.appliedFragments.findIndex((entry) => entry.id === state.selectedMeasureId)
    : -1;
  // A fresh (non-kept) context still honors the hymn: a mid-hymn measure
  // grows out of its predecessor; only the FIRST measure adopts the
  // sample's own opening seam.
  const freshContext = (opening: AcceptedContext): AcceptedContext =>
    selectedIndex > 0
      ? acceptedContextForIndex(state.appliedFragments, selectedIndex)
      : opening;
  if (action.source.kind === 'fixture') {
    const fixture = action.source.fixture;
    const init = fixture.initialState;
    const acceptedContext = action.keepAcceptedContext
      ? state.acceptedContext
      : freshContext(init.acceptedContext);
    const next: WorkbenchState = {
      ...base,
      tonalContext: init.tonalContext,
      phraseIntent: init.phraseIntent,
      tempoBpm: init.tempoBpm,
      acceptedContext,
      fragment: init.fragment,
      boundaryConstraints: init.boundaryConstraints,
      locks: [],
      sourceFixtureId: fixture.id,
    };
    const pinned = fixture.match.acceptedHarmonySignature;
    if (
      pinned !== undefined &&
      pinned !== acceptedHarmonySignature(acceptedContext.previousHarmony)
    ) {
      // The context in force (kept, or a mid-hymn predecessor seam)
      // diverges from the fixture's pin — resolve honestly.
      // Loading a sample is an explicit replacement: clear the working
      // reading so the resolution owns the whole workspace.
      return regenerate({
        ...next,
        candidates: [],
        selectedCandidateId: null,
        candidateSetId: null,
      });
    }
    const set = defaultCandidateSet(fixture);
    return {
      ...next,
      candidates: stampApproach(set.candidates, acceptedContext),
      candidateSetId: set.id,
      selectedCandidateId: set.candidates[0]?.id ?? null,
      suggestionStatus: set.candidates.length > 0 ? 'fresh' : 'empty',
      suggestionSource: set.candidates.length > 0 ? 'authored' : null,
    };
  }
  const next: WorkbenchState = {
    ...base,
    fragment: action.source.fragment,
    boundaryConstraints: [],
    locks: [],
    acceptedContext: action.keepAcceptedContext
      ? state.acceptedContext
      : freshContext({ previousHarmony: null, previousVoicing: null }),
    sourceFixtureId: null,
    // Explicit replacement — the blank sample owns the workspace. If the
    // resolution comes back empty (unsupported mode), the selected
    // measure's entry stays as it was, stale against the workspace melody
    // until the next selection — rare, self-healing (sync skips when no
    // candidate is selected).
    candidates: [],
    selectedCandidateId: null,
    candidateSetId: null,
  };
  return regenerate(next);
}

/* ---------- persistence-v2 rehydration ---------- */

/** A stripped saved candidate back to a full CandidatePath stub; the caller
 * re-derives the analysis fields. */
function rehydrateCandidate(persisted: PersistedCandidate): CandidatePath {
  return { ...persisted, harmonyEvents: [], melodyInterpretations: [] };
}

/**
 * An applied rail piece keeps its saved identity (title, summary, curated
 * descriptors, provenance) — only the re-derivable analysis is rebuilt, read
 * in the piece's OWN key (mid-hymn modulation is a feature).
 */
function rehydrateAppliedCandidate(applied: PersistedAppliedFragment): CandidatePath {
  const stub = rehydrateCandidate(applied.candidate);
  const annotation = annotateVoicing(
    stub.voicing,
    applied.fragment,
    applied.candidate.tonalContext,
    null,
    stub.id,
  );
  return {
    ...stub,
    harmonyEvents: annotation.harmonyEvents,
    melodyInterpretations: annotation.melodyInterpretations,
  };
}

export function loadProject(
  action: Extract<WorkbenchAction, { type: 'LOAD_PROJECT' }>,
): WorkbenchState {
  // Rehydration (persistence v2): saved projects store the notes and the
  // curated-feeling fields; ALL analysis re-derives here — the notes are
  // the truth, and a newer engine reads them with its current eyes.
  const saved = action.workbench;
  const working = saved.workingCandidate
    ? rehydrateCandidate(saved.workingCandidate)
    : null;
  const rehydrated = saved.appliedFragments.map((applied) => ({
    id: applied.id,
    fragment: applied.fragment,
    candidate: rehydrateAppliedCandidate(applied),
  }));
  const savedSelection =
    saved.selectedMeasureId &&
    rehydrated.some((entry) => entry.id === saved.selectedMeasureId)
      ? saved.selectedMeasureId
      : null;
  let appliedFragments = rehydrated;
  let selectedMeasureId = savedSelection;
  if (!selectedMeasureId && working) {
    // Old save (pre-selectedMeasureId) or a selection lost to trimming:
    // the separately-saved working reading becomes the selected measure,
    // appended. Deterministic id (purity) — the `measure-` prefix cannot
    // collide with caller-minted entry ids.
    selectedMeasureId = `measure-${saved.fragment.id}`;
    appliedFragments = [
      ...rehydrated,
      { id: selectedMeasureId, fragment: saved.fragment, candidate: working },
    ];
  }
  const loaded: WorkbenchState = {
    tonalContext: saved.tonalContext,
    phraseIntent: saved.phraseIntent,
    tempoBpm: saved.tempoBpm,
    acceptedContext: saved.acceptedContext,
    appliedFragments,
    fragment: saved.fragment,
    boundaryConstraints: saved.boundaryConstraints,
    suggestionStatus: 'empty',
    suggestionSource: null,
    sourceFixtureId: saved.sourceFixtureId,
    candidateSetId: null,
    // The workspace loads from the top-level copies (identical to the
    // selected entry via write-through; top-level wins if storage was
    // hand-edited); the sync wrapper then re-points the entry at the
    // freshly derived candidate.
    candidates: working ? [working] : [],
    selectedCandidateId: working?.id ?? null,
    locks: saved.locks,
    playback: { status: 'idle' },
    history: [],
    future: [],
    lastGestureId: null,
    selectedMeasureId,
  };
  return regenerate(deriveCandidate(loaded, loaded.selectedCandidateId));
}
