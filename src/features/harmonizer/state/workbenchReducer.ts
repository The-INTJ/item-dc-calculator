/**
 * Workbench reducer — full-POC edition. House pattern: pure reducer kept
 * module-private, exhaustive switch with no default case, hook wrapper
 * exported. The reducer imports only pure, deterministic modules (the static
 * fixture registry and the naive generator), so reducer purity holds.
 *
 * THE SURFACE RULE (Drew): the selected reading's notes are the source of
 * truth. An edit to one note NEVER moves another note and NEVER swaps the
 * working reading — its chord analysis re-derives FROM the sounding notes
 * (domain/derive-harmony.ts). Live regeneration only replaces the SUGGESTION
 * cards around the surface; adopting one is an explicit card click.
 *
 * History: MAX_HISTORY undoable snapshots; drags coalesce per gestureId; ids
 * are always minted by callers (no Date/crypto here — purity + StrictMode).
 */

import { useReducer } from 'react';
import { stampApproach } from '../domain/approach';
import { withDerivedAnalysis } from '../domain/derive-harmony';
import type { HarmonizationFixture } from '../domain/fixture-types';
import type {
  MelodyEvent,
  SATBVoicing,
  VoiceEvent,
  VoiceId,
} from '../domain/music-types';
import { resolveLockEntries } from '../domain/lock-signature';
import { continuationFragment } from '../domain/next-fragment';
import { respellAccepted, respellCandidate, respellFragment } from '../domain/respell';
import { stepDiatonic } from '../domain/scale';
import { acceptedHarmonySignature } from '../domain/signatures';
import {
  asAcceptedHarmony,
  defaultCandidateSet,
  resolveSuggestions,
  type SuggestionResolution,
} from '../domain/suggest';
import { unitsToDuration, unitsToTime } from '../domain/timing';
import {
  deleteTimedEvent,
  insertAdjacentTimedEvent,
  resizeTimedEvents,
} from '../domain/voice-editing';
import type {
  PersistedAppliedFragment,
  PersistedCandidate,
  WorkbenchSnapshot,
  WorkbenchState,
} from '../domain/workbench-state';
import type { CandidatePath } from '../domain/analysis-types';
import { annotateVoicing } from '../domain/engine/annotate';
import { listFixtures } from '../fixtures/registry';
import { composeCandidateProse } from '../knowledge/compose/composer';
import type { WorkbenchAction } from './actions';

export const MIN_TEMPO_BPM = 40;
export const MAX_TEMPO_BPM = 200;
export const MAX_HISTORY = 50;

export function createInitialWorkbenchState(fixture: HarmonizationFixture): WorkbenchState {
  const candidateSet =
    fixture.candidateSets.find((set) => set.id === 'default') ?? fixture.candidateSets[0];
  const candidates = candidateSet
    ? stampApproach(candidateSet.candidates, fixture.initialState.acceptedContext)
    : [];
  return {
    tonalContext: fixture.initialState.tonalContext,
    phraseIntent: fixture.initialState.phraseIntent,
    tempoBpm: fixture.initialState.tempoBpm,
    acceptedContext: fixture.initialState.acceptedContext,
    appliedFragments: [],
    fragment: fixture.initialState.fragment,
    boundaryConstraints: fixture.initialState.boundaryConstraints,
    suggestionStatus: candidates.length > 0 ? 'fresh' : 'empty',
    suggestionSource: candidates.length > 0 ? 'authored' : null,
    sourceFixtureId: fixture.id,
    candidateSetId: candidateSet ? candidateSet.id : null,
    candidates,
    // Spec §10.1 step 7: the first candidate is preview-selected, not applied.
    selectedCandidateId: candidates.length > 0 ? candidates[0].id : null,
    locks: [],
    playback: { status: 'idle' },
    history: [],
    future: [],
    lastGestureId: null,
    editingAppliedId: null,
  };
}

/* ---------- history ---------- */

function takeSnapshot(state: WorkbenchState): WorkbenchSnapshot {
  return {
    tonalContext: state.tonalContext,
    phraseIntent: state.phraseIntent,
    acceptedContext: state.acceptedContext,
    appliedFragments: state.appliedFragments,
    fragment: state.fragment,
    boundaryConstraints: state.boundaryConstraints,
    suggestionStatus: state.suggestionStatus,
    suggestionSource: state.suggestionSource,
    sourceFixtureId: state.sourceFixtureId,
    candidateSetId: state.candidateSetId,
    candidates: state.candidates,
    selectedCandidateId: state.selectedCandidateId,
    locks: state.locks,
  };
}

/** Snapshot the PRE-mutation state; clears the redo stack. */
function pushHistory(state: WorkbenchState): WorkbenchState {
  return {
    ...state,
    history: [...state.history, takeSnapshot(state)].slice(-MAX_HISTORY),
    future: [],
    lastGestureId: null,
  };
}

/** Like pushHistory, but consecutive dispatches of one drag coalesce. */
function pushHistoryForGesture(state: WorkbenchState, gestureId: string): WorkbenchState {
  if (state.lastGestureId === gestureId) {
    return { ...state, future: [] };
  }
  return { ...pushHistory(state), lastGestureId: gestureId };
}

/* ---------- suggestion regeneration ---------- */

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
function deriveCandidate(state: WorkbenchState, candidateId: string | null): WorkbenchState {
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

/** Compose prose for the resolution's computed candidates (authored pass through). */
function composeResolution(resolution: SuggestionResolution): SuggestionResolution {
  if (resolution.kind !== 'replace') return resolution;
  return { ...resolution, candidates: resolution.candidates.map(composeCandidateProse) };
}

function regenerate(state: WorkbenchState): WorkbenchState {
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

/* ---------- voice-edit helpers ---------- */

function withVoice(voicing: SATBVoicing, voice: VoiceId, events: VoiceEvent[]): SATBVoicing {
  return {
    soprano: voice === 'soprano' ? events : voicing.soprano,
    alto: voice === 'alto' ? events : voicing.alto,
    tenor: voice === 'tenor' ? events : voicing.tenor,
    bass: voice === 'bass' ? events : voicing.bass,
  };
}

function isNoteLocked(state: WorkbenchState, candidateId: string, eventId: string): boolean {
  return state.locks.some(
    (lock) =>
      lock.targetType === 'voice_event' &&
      lock.candidateId === candidateId &&
      lock.targetId === eventId,
  );
}

interface VoiceEditResult {
  candidates: WorkbenchState['candidates'];
  fragment: WorkbenchState['fragment'];
}

/**
 * Apply an edit to one voice of one candidate; soprano edits mirror onto the
 * melody fragment (index correspondence). Null = no-op.
 */
function editVoice(
  state: WorkbenchState,
  candidateId: string,
  voice: VoiceId,
  editEvents: (events: VoiceEvent[]) => VoiceEvent[] | null,
  editMelody: (events: MelodyEvent[]) => MelodyEvent[] | null,
): VoiceEditResult | null {
  const index = state.candidates.findIndex((candidate) => candidate.id === candidateId);
  if (index === -1) return null;
  const candidate = state.candidates[index];
  const edited = editEvents(candidate.voicing[voice]);
  if (!edited) return null;
  const voicing = withVoice(candidate.voicing, voice, edited);
  const candidates = state.candidates.map((entry, i) =>
    i === index ? { ...entry, voicing } : entry,
  );
  let fragment = state.fragment;
  if (voice === 'soprano') {
    const melodyEvents = editMelody(state.fragment.events);
    if (melodyEvents) fragment = { ...state.fragment, events: melodyEvents };
  }
  return { candidates, fragment };
}

/* ---------- applying the working reading ---------- */

interface AppliedResult {
  next: WorkbenchState;
  /** The reading that was just committed — what the next fragment grows from. */
  candidate: CandidatePath;
}

/**
 * Commit the working reading to the composition. Reworking an existing piece
 * replaces it where it stands (its id and position in the hymn survive); a
 * fresh piece appends. Null when there is nothing to commit.
 */
function applyWorkingReading(state: WorkbenchState, appliedId: string): AppliedResult | null {
  const candidate = state.candidates.find((entry) => entry.id === state.selectedCandidateId);
  if (!candidate) return null;
  const finalHarmony = candidate.harmonyEvents[candidate.harmonyEvents.length - 1];
  if (!finalHarmony) return null;

  const editingIndex = state.editingAppliedId
    ? state.appliedFragments.findIndex((entry) => entry.id === state.editingAppliedId)
    : -1;
  if (editingIndex >= 0) {
    const existingId = state.appliedFragments[editingIndex].id;
    const appliedFragments = state.appliedFragments.map((entry, index) =>
      index === editingIndex
        ? { id: existingId, fragment: state.fragment, candidate }
        : entry,
    );
    // Finishing a rework puts you back at the end of the hymn: the accepted
    // context is the tail's harmony again, not the reworked piece's own.
    const tail = appliedFragments[appliedFragments.length - 1];
    const tailFinal = tail.candidate.harmonyEvents[tail.candidate.harmonyEvents.length - 1];
    return {
      next: {
        ...pushHistory(state),
        appliedFragments,
        editingAppliedId: null,
        acceptedContext: tailFinal
          ? {
              previousHarmony: asAcceptedHarmony(tailFinal, tail.id),
              // The notes the hymn leaves off on — what the next snippet's
              // first chord is read against (domain/approach.ts).
              previousVoicing: tail.candidate.voicing,
            }
          : state.acceptedContext,
      },
      candidate: tail.candidate,
    };
  }

  return {
    next: {
      ...pushHistory(state),
      appliedFragments: [
        ...state.appliedFragments,
        { id: appliedId, fragment: state.fragment, candidate },
      ],
      acceptedContext: {
        previousHarmony: asAcceptedHarmony(finalHarmony, appliedId),
        previousVoicing: candidate.voicing,
      },
    },
    candidate,
  };
}

/* ---------- reducer ---------- */

function workbenchReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'LOAD_FIXTURE':
      return createInitialWorkbenchState(action.fixture);

    case 'LOAD_SAMPLE': {
      // A new fragment is not the applied piece you were reworking.
      const base = { ...pushHistory(state), editingAppliedId: null };
      if (action.source.kind === 'fixture') {
        const fixture = action.source.fixture;
        const init = fixture.initialState;
        const acceptedContext = action.keepAcceptedContext
          ? state.acceptedContext
          : init.acceptedContext;
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
          action.keepAcceptedContext &&
          pinned !== undefined &&
          pinned !== acceptedHarmonySignature(acceptedContext.previousHarmony)
        ) {
          // The kept context diverges from the fixture's pin — resolve honestly.
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
          : { previousHarmony: null, previousVoicing: null },
        sourceFixtureId: null,
        // Explicit replacement — the blank sample owns the workspace.
        candidates: [],
        selectedCandidateId: null,
        candidateSetId: null,
      };
      return regenerate(next);
    }

    case 'LOAD_PROJECT': {
      // Rehydration (persistence v2): saved projects store the notes and the
      // curated-feeling fields; ALL analysis re-derives here — the notes are
      // the truth, and a newer engine reads them with its current eyes.
      const saved = action.workbench;
      const working = saved.workingCandidate
        ? rehydrateCandidate(saved.workingCandidate)
        : null;
      const loaded: WorkbenchState = {
        tonalContext: saved.tonalContext,
        phraseIntent: saved.phraseIntent,
        tempoBpm: saved.tempoBpm,
        acceptedContext: saved.acceptedContext,
        appliedFragments: saved.appliedFragments.map((applied) => ({
          id: applied.id,
          fragment: applied.fragment,
          candidate: rehydrateAppliedCandidate(applied),
        })),
        fragment: saved.fragment,
        boundaryConstraints: saved.boundaryConstraints,
        suggestionStatus: 'empty',
        suggestionSource: null,
        sourceFixtureId: saved.sourceFixtureId,
        candidateSetId: null,
        candidates: working ? [working] : [],
        selectedCandidateId: working?.id ?? null,
        locks: saved.locks,
        playback: { status: 'idle' },
        history: [],
        future: [],
        lastGestureId: null,
        editingAppliedId: null,
      };
      return regenerate(deriveCandidate(loaded, loaded.selectedCandidateId));
    }

    case 'EDIT_TONAL_CONTEXT': {
      const same =
        state.tonalContext.tonicPitchClass === action.tonalContext.tonicPitchClass &&
        state.tonalContext.tonic.letter === action.tonalContext.tonic.letter &&
        state.tonalContext.tonic.accidental === action.tonalContext.tonic.accidental &&
        state.tonalContext.mode === action.tonalContext.mode &&
        state.tonalContext.minorDoSystem === action.tonalContext.minorDoSystem;
      if (same) return state;
      // Key change re-READS everything and never rewrites a note: every pitch
      // stays byte-identical while its scaleDegree metadata (fragment, every
      // candidate's voicing, the accepted seam) is recomputed in the new key.
      // Applied fragments are deliberately untouched — each carries its own
      // tonalContext, so a mid-hymn key change is a feature, not corruption.
      const context = action.tonalContext;
      const next = {
        ...pushHistory(state),
        tonalContext: context,
        fragment: respellFragment(context, state.fragment),
        candidates: state.candidates.map((candidate) => respellCandidate(context, candidate)),
        acceptedContext: respellAccepted(context, state.acceptedContext),
      };
      return regenerate(deriveCandidate(next, next.selectedCandidateId));
    }

    case 'EDIT_PHRASE_INTENT': {
      if (state.phraseIntent === action.phraseIntent) return state;
      return regenerate({ ...pushHistory(state), phraseIntent: action.phraseIntent });
    }

    case 'SET_ACCEPTED_HARMONY': {
      if (
        acceptedHarmonySignature(action.harmony) ===
        acceptedHarmonySignature(state.acceptedContext.previousHarmony)
      ) {
        return state;
      }
      return regenerate({
        ...pushHistory(state),
        acceptedContext: { previousHarmony: action.harmony, previousVoicing: null },
      });
    }

    case 'STEP_VOICE_EVENT_PITCH': {
      if (isNoteLocked(state, action.candidateId, action.eventId)) return state;
      const stepEvents = (events: VoiceEvent[]): VoiceEvent[] | null => {
        const index = events.findIndex((event) => event.id === action.eventId);
        if (index === -1) return null;
        const stepped = stepDiatonic(state.tonalContext, events[index], action.direction);
        if (!stepped) return null;
        return events.map((event, i) =>
          i === index ? { ...event, pitch: stepped.pitch, scaleDegree: stepped.scaleDegree } : event,
        );
      };
      const sopranoIndex = state.candidates
        .find((candidate) => candidate.id === action.candidateId)
        ?.voicing.soprano.findIndex((event) => event.id === action.eventId);
      const result = editVoice(state, action.candidateId, action.voice, stepEvents, (events) => {
        if (sopranoIndex === undefined || sopranoIndex < 0) return null;
        const melodyEvent = events[sopranoIndex];
        if (!melodyEvent) return null;
        const stepped = stepDiatonic(state.tonalContext, melodyEvent, action.direction);
        if (!stepped) return null;
        return events.map((event, i) =>
          i === sopranoIndex
            ? { ...event, pitch: stepped.pitch, scaleDegree: stepped.scaleDegree }
            : event,
        );
      });
      if (!result) return state;
      const next = deriveCandidate({ ...pushHistory(state), ...result }, action.candidateId);
      return action.voice === 'soprano' ? regenerate(next) : next;
    }

    case 'INSERT_VOICE_EVENT': {
      const insertEvents = (events: VoiceEvent[]): VoiceEvent[] | null => {
        const neighbor = events.find((event) => event.id === action.neighborEventId);
        if (!neighbor) return null;
        return insertAdjacentTimedEvent(events, action.neighborEventId, action.side, (placement) => ({
          id: action.newEventId,
          voice: action.voice,
          pitch: neighbor.pitch,
          scaleDegree: neighbor.scaleDegree,
          start: unitsToTime(placement.startUnits),
          duration: unitsToDuration(placement.units),
          tieFromPrevious: false,
        }));
      };
      const sopranoNeighborIndex = state.candidates
        .find((candidate) => candidate.id === action.candidateId)
        ?.voicing.soprano.findIndex((event) => event.id === action.neighborEventId);
      const result = editVoice(
        state,
        action.candidateId,
        action.voice,
        insertEvents,
        (events) => {
          if (sopranoNeighborIndex === undefined || sopranoNeighborIndex < 0) return null;
          const neighbor = events[sopranoNeighborIndex];
          if (!neighbor) return null;
          return insertAdjacentTimedEvent(events, neighbor.id, action.side, (placement) => ({
            id: `mel-${action.newEventId}`,
            pitch: neighbor.pitch,
            scaleDegree: neighbor.scaleDegree,
            start: unitsToTime(placement.startUnits),
            duration: unitsToDuration(placement.units),
            tieFromPrevious: false,
          }));
        },
      );
      if (!result) return state;
      const next = deriveCandidate({ ...pushHistory(state), ...result }, action.candidateId);
      return action.voice === 'soprano' ? regenerate(next) : next;
    }

    case 'DELETE_VOICE_EVENT': {
      if (isNoteLocked(state, action.candidateId, action.eventId)) return state;
      const sopranoIndex = state.candidates
        .find((candidate) => candidate.id === action.candidateId)
        ?.voicing.soprano.findIndex((event) => event.id === action.eventId);
      const result = editVoice(
        state,
        action.candidateId,
        action.voice,
        (events) => deleteTimedEvent(events, action.eventId),
        (events) => {
          if (sopranoIndex === undefined || sopranoIndex < 0) return null;
          const melodyEvent = events[sopranoIndex];
          if (!melodyEvent) return null;
          return deleteTimedEvent(events, melodyEvent.id);
        },
      );
      if (!result) return state;
      const locks = state.locks.filter(
        (lock) => !(lock.targetType === 'voice_event' && lock.targetId === action.eventId),
      );
      const next = deriveCandidate(
        { ...pushHistory(state), ...result, locks },
        action.candidateId,
      );
      return action.voice === 'soprano' ? regenerate(next) : next;
    }

    case 'RESIZE_VOICE_EVENT': {
      if (isNoteLocked(state, action.candidateId, action.eventId)) return state;
      const sopranoIndex = state.candidates
        .find((candidate) => candidate.id === action.candidateId)
        ?.voicing.soprano.findIndex((event) => event.id === action.eventId);
      const result = editVoice(
        state,
        action.candidateId,
        action.voice,
        (events) =>
          resizeTimedEvents(events, action.eventId, action.edge, action.targetBoundary, {
            ripple: action.ripple,
          }),
        (events) => {
          if (sopranoIndex === undefined || sopranoIndex < 0) return null;
          const melodyEvent = events[sopranoIndex];
          if (!melodyEvent) return null;
          return resizeTimedEvents(events, melodyEvent.id, action.edge, action.targetBoundary, {
            ripple: action.ripple,
          });
        },
      );
      if (!result) return state;
      const next = deriveCandidate(
        { ...pushHistoryForGesture(state, action.gestureId), ...result },
        action.candidateId,
      );
      return action.voice === 'soprano' ? regenerate(next) : next;
    }

    case 'SELECT_CANDIDATE': {
      if (state.selectedCandidateId === action.candidateId) return state;
      if (!state.candidates.some((candidate) => candidate.id === action.candidateId)) {
        return state;
      }
      return { ...pushHistory(state), selectedCandidateId: action.candidateId };
    }

    case 'TOGGLE_LOCK': {
      // Unlock removes every lock resolving to the same note VALUE (a lock-set
      // remap spreads one conceptual lock across sibling candidates).
      const clicked = resolveLockEntries([action.lock], state.candidates)[0] ?? null;
      const matching = state.locks.filter((lock) => {
        if (
          lock.targetType === action.lock.targetType &&
          lock.targetId === action.lock.targetId &&
          lock.candidateId === action.lock.candidateId
        ) {
          return true;
        }
        if (!clicked) return false;
        const entry = resolveLockEntries([lock], state.candidates)[0];
        return (
          entry !== undefined &&
          entry.voice === clicked.voice &&
          entry.startUnit === clicked.startUnit &&
          entry.units === clicked.units &&
          entry.pitch.midi === clicked.pitch.midi
        );
      });
      const locks =
        matching.length > 0
          ? state.locks.filter((lock) => !matching.includes(lock))
          : [...state.locks, action.lock];
      return regenerate({ ...pushHistory(state), locks });
    }

    case 'SET_TEMPO': {
      const tempoBpm = Math.min(
        MAX_TEMPO_BPM,
        Math.max(MIN_TEMPO_BPM, Math.round(action.tempoBpm)),
      );
      if (tempoBpm === state.tempoBpm) return state;
      return { ...state, tempoBpm };
    }

    case 'APPLY_CANDIDATE': {
      const applied = applyWorkingReading(state, action.appliedId);
      return applied ? applied.next : state;
    }

    case 'START_NEXT_FRAGMENT': {
      const applied = applyWorkingReading(state, action.appliedId);
      if (!applied) return state;
      const continuation = continuationFragment(applied.candidate, {
        fragmentId: action.fragmentId,
        candidateId: action.candidateId,
        melodyEventId: action.melodyEventId,
        voiceEventIds: action.voiceEventIds,
      });
      // A part with no notes has nothing to carry over — the commit still
      // stands, you just stay where you are.
      if (!continuation) return applied.next;
      const opened: WorkbenchState = {
        ...applied.next,
        fragment: continuation.fragment,
        boundaryConstraints: [],
        locks: [],
        // The new fragment is yours, not a sample's — Restore has nothing to
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

    case 'EDIT_APPLIED_FRAGMENT': {
      const index = state.appliedFragments.findIndex((entry) => entry.id === action.appliedId);
      if (index === -1) return state;
      const applied = state.appliedFragments[index];
      // The piece before it is this piece's harmonic context; the first piece
      // opens the hymn.
      const previous = index > 0 ? state.appliedFragments[index - 1] : null;
      const previousFinal = previous
        ? previous.candidate.harmonyEvents[previous.candidate.harmonyEvents.length - 1]
        : null;
      const loaded: WorkbenchState = {
        ...pushHistory(state),
        fragment: applied.fragment,
        tonalContext: applied.candidate.tonalContext,
        phraseIntent: applied.candidate.phraseIntent,
        acceptedContext: {
          previousHarmony:
            previous && previousFinal ? asAcceptedHarmony(previousFinal, previous.id) : null,
          // Reworking a middle piece must see the notes it grows out of.
          previousVoicing: previous ? previous.candidate.voicing : null,
        },
        boundaryConstraints: [],
        locks: [],
        candidates: [applied.candidate],
        candidateSetId: null,
        selectedCandidateId: applied.candidate.id,
        suggestionStatus: 'fresh',
        suggestionSource: applied.candidate.provenance.fixtureAuthored ? 'authored' : 'computed',
        editingAppliedId: applied.id,
      };
      // Suggestions re-resolve AROUND the loaded piece; the surface rule keeps
      // the piece itself exactly as it was applied.
      return regenerate(loaded);
    }

    case 'UNDO': {
      const previous = state.history[state.history.length - 1];
      if (!previous) return state;
      return {
        ...state,
        ...previous,
        history: state.history.slice(0, -1),
        future: [...state.future, takeSnapshot(state)].slice(-MAX_HISTORY),
        lastGestureId: null,
        playback: { status: 'idle' },
      };
    }

    case 'REDO': {
      const next = state.future[state.future.length - 1];
      if (!next) return state;
      return {
        ...state,
        ...next,
        future: state.future.slice(0, -1),
        history: [...state.history, takeSnapshot(state)].slice(-MAX_HISTORY),
        lastGestureId: null,
        playback: { status: 'idle' },
      };
    }

    case 'START_PLAYBACK':
      return {
        ...state,
        playback: {
          status: 'playing',
          candidateId: action.candidateId,
          voices: action.voices,
          activeUnit: null,
        },
      };
    case 'STOP_PLAYBACK': {
      if (state.playback.status === 'idle') return state;
      return { ...state, playback: { status: 'idle' } };
    }
    case 'PLAYBACK_PROGRESS': {
      // Late cursor callbacks after a stop are dropped.
      if (state.playback.status !== 'playing') return state;
      if (state.playback.activeUnit === action.activeUnit) return state;
      return { ...state, playback: { ...state.playback, activeUnit: action.activeUnit } };
    }
  }
}

export function useWorkbenchReducer(initialFixture: HarmonizationFixture) {
  return useReducer(workbenchReducer, initialFixture, createInitialWorkbenchState);
}

/** Direct access for unit tests (spec §28.1); not exported from the barrel. */
export { workbenchReducer };
