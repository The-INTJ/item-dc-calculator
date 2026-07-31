/**
 * THE UNIFIED MEASURE LIST: the hymn (appliedFragments) always contains every
 * measure INCLUDING the one being edited; selectedMeasureId points at it.
 * This module owns the measure seam, rail navigation, appending measures, and
 * the write-through sync that mirrors the workspace into the selected entry.
 */

import { continuationFragment } from '../../domain/next-fragment';
import { asAcceptedHarmony } from '../../domain/suggest';
import type {
  AcceptedContext,
  AppliedFragment,
  WorkbenchState,
} from '../../domain/workbench-state';
import type { WorkbenchAction } from '../actions';
import { pushHistory } from './history';
import { deriveCandidate, regenerate } from './suggestion-regeneration';

/* ---------- the measure seam ---------- */

/**
 * The seam a measure at `index` grows out of: its predecessor's final chord
 * and notes (what the measure's first chord is read against —
 * domain/approach.ts). Index 0 opens the hymn.
 */
export function acceptedContextForIndex(
  applied: AppliedFragment[],
  index: number,
): AcceptedContext {
  const previous = index > 0 ? applied[index - 1] : null;
  const previousFinal = previous
    ? previous.candidate.harmonyEvents[previous.candidate.harmonyEvents.length - 1]
    : null;
  return {
    previousHarmony:
      previous && previousFinal ? asAcceptedHarmony(previousFinal, previous.id) : null,
    previousVoicing: previous ? previous.candidate.voicing : null,
  };
}

export function addMeasure(
  state: WorkbenchState,
  action: Extract<WorkbenchAction, { type: 'ADD_MEASURE' }>,
): WorkbenchState {
  // No commit step — the outgoing measure is already up to date via the
  // write-through sync. The new measure always APPENDS at the end,
  // continuing from the TAIL's final chord (even while an earlier measure
  // is selected).
  const tail = state.appliedFragments[state.appliedFragments.length - 1];
  if (!tail) return state;
  const continuation = continuationFragment(tail.candidate, {
    fragmentId: action.fragmentId,
    candidateId: action.candidateId,
    melodyEventId: action.melodyEventId,
    voiceEventIds: action.voiceEventIds,
  });
  // A part with no notes has nothing to carry over — nothing to open.
  if (!continuation) return state;
  const appliedFragments = [
    ...state.appliedFragments,
    {
      id: action.appliedId,
      fragment: continuation.fragment,
      candidate: continuation.candidate,
    },
  ];
  const opened: WorkbenchState = {
    ...pushHistory(state),
    appliedFragments,
    selectedMeasureId: action.appliedId,
    fragment: continuation.fragment,
    // Adopt the tail's key and intent — the continuation was derived in
    // them, and the workbench may have been sitting in an earlier
    // measure's different key (mid-hymn modulation).
    tonalContext: tail.candidate.tonalContext,
    phraseIntent: tail.candidate.phraseIntent,
    acceptedContext: acceptedContextForIndex(appliedFragments, appliedFragments.length - 1),
    boundaryConstraints: [],
    locks: [],
    // The new measure is yours, not a sample's — Restore has nothing to
    // restore to and the lock-set lookup must not reach for one.
    sourceFixtureId: null,
    candidates: [continuation.candidate],
    candidateSetId: null,
    selectedCandidateId: continuation.candidate.id,
    suggestionStatus: 'fresh',
    suggestionSource: 'computed',
  };
  return regenerate(deriveCandidate(opened, opened.selectedCandidateId));
}

export function selectMeasure(state: WorkbenchState, appliedId: string): WorkbenchState {
  // Rail clicks are casual navigation — re-clicking the selected measure
  // must not spam history.
  if (appliedId === state.selectedMeasureId) return state;
  const index = state.appliedFragments.findIndex((entry) => entry.id === appliedId);
  if (index === -1) return state;
  const applied = state.appliedFragments[index];
  const loaded: WorkbenchState = {
    ...pushHistory(state),
    fragment: applied.fragment,
    tonalContext: applied.candidate.tonalContext,
    phraseIntent: applied.candidate.phraseIntent,
    acceptedContext: acceptedContextForIndex(state.appliedFragments, index),
    boundaryConstraints: [],
    locks: [],
    candidates: [applied.candidate],
    candidateSetId: null,
    selectedCandidateId: applied.candidate.id,
    suggestionStatus: 'fresh',
    suggestionSource: applied.candidate.provenance.fixtureAuthored ? 'authored' : 'computed',
    selectedMeasureId: applied.id,
  };
  // Suggestions re-resolve AROUND the loaded measure; the surface rule
  // keeps the measure itself exactly as it stands.
  return regenerate(loaded);
}

/* ---------- write-through sync ---------- */

/**
 * THE MEASURE MIRROR: after every action the selected measure's list entry is
 * made to match the workspace ({fragment, selected candidate}), so the rail
 * pill is always live and nothing ever needs an explicit commit.
 *
 * Keys on the MEASURE id, never the candidate id — candidate ids can repeat
 * across measures (the same authored reading applied twice), and only
 * selectedMeasureId says which entry mirrors the workspace.
 *
 * Reference short-circuit: when neither the fragment nor the selected
 * candidate object changed, the SAME state object returns — playback ticks,
 * tempo edits and no-op guards never churn appliedFragments (the autosave dep
 * array and React memoization rely on this). Snapshots are only ever taken of
 * already-synced states, so UNDO/REDO restore synced states by induction.
 */
export function syncSelectedMeasure(state: WorkbenchState): WorkbenchState {
  const id = state.selectedMeasureId;
  if (!id) return state;
  const index = state.appliedFragments.findIndex((entry) => entry.id === id);
  // A dangling selection (hand-edited save) never invents an entry.
  if (index === -1) return state;
  const candidate =
    state.candidates.find((entry) => entry.id === state.selectedCandidateId) ?? null;
  // Empty-candidates corner (blank sample in an unsupported mode): leave the
  // entry as it was rather than writing a measure with no reading.
  if (!candidate) return state;
  const entry = state.appliedFragments[index];
  if (entry.fragment === state.fragment && entry.candidate === candidate) return state;
  return {
    ...state,
    appliedFragments: state.appliedFragments.map((measure, i) =>
      i === index ? { id, fragment: state.fragment, candidate } : measure,
    ),
  };
}
