/**
 * Live suggestion resolution — pure and deterministic; the reducer calls this
 * on every relevant edit so suggestions regenerate immediately.
 *
 * ENGINE-FIRST (v1): the generator is the suggestion path. With or without
 * locks, candidates come from domain/engine/generate.ts — real chord choices,
 * real voicings, honest `?` holes when locks (or a chromatic melody note)
 * rule everything out. Authored fixtures no longer outrank live analysis:
 * they remain reachable ONLY as explicit Samples-menu loads and as the
 * fallback for tonal contexts the engine does not support yet (do-based
 * minor, dorian…), where honest fixture content beats an empty screen.
 * Phrase intent NEVER filters — it ranks (spec §9.2).
 */

import type { CandidatePath } from './analysis-types';
import { approachFromAccepted } from './approach';
import { assembleSkeletons, type LockedPitchConstraint } from './enumerate';
import type { FixtureCandidateSet, HarmonizationFixture } from './fixture-types';
import {
  resolveLockEntries,
  type LockSignatureEntry,
} from './lock-signature';
import type { ConstraintLock } from './locks';
import type {
  BoundaryConstraint,
  HarmonyEvent,
  MelodyFragment,
  ModeId,
  PhraseIntent,
  TonalContext,
} from './music-types';
import { melodySignature } from './signatures';
import { toTimelineSpan } from './timing';
import type { AcceptedContext } from './workbench-state';

export interface MatchCriteria {
  tonicPitchClass: number;
  mode: ModeId;
  melodySignature: string;
}

/**
 * Fixture lookup — used ONLY for unsupported-context fallback and by tests;
 * live resolution in supported keys never consults it.
 */
export function matchFixture(
  fixtures: readonly HarmonizationFixture[],
  criteria: MatchCriteria,
): HarmonizationFixture | null {
  return (
    fixtures.find(
      (fixture) =>
        fixture.match.tonalContext.tonicPitchClass === criteria.tonicPitchClass &&
        fixture.match.tonalContext.mode === criteria.mode &&
        fixture.match.melodySignature === criteria.melodySignature,
    ) ?? null
  );
}

/** The set without a lockSignature (id 'default' by convention). */
export function defaultCandidateSet(fixture: HarmonizationFixture): FixtureCandidateSet {
  return fixture.candidateSets.find((set) => !set.lockSignature) ?? fixture.candidateSets[0];
}

/** Retime an applied candidate's final harmony into the accepted-context measure-0 convention. */
export function asAcceptedHarmony(event: HarmonyEvent, appliedId: string): HarmonyEvent {
  return {
    ...event,
    id: `applied-${appliedId}`,
    start: { measure: 0, beat: 1, subdivision: 0 },
    duration: { numerator: 1, denominator: 1 },
  };
}

export interface SuggestInput {
  fragment: MelodyFragment;
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  acceptedContext: AcceptedContext;
  boundaryConstraints: BoundaryConstraint[];
  locks: ConstraintLock[];
  candidates: CandidatePath[];
  sourceFixtureId: string | null;
  fixtures: readonly HarmonizationFixture[];
}

export type SuggestionResolution =
  | {
      kind: 'replace';
      candidates: CandidatePath[];
      candidateSetId: string | null;
      sourceFixtureId: string | null;
      suggestionSource: 'authored' | 'computed';
      /** Non-null when a fixture was adopted — its boundary metadata rides along. */
      boundaryConstraints: BoundaryConstraint[] | null;
      /**
       * Non-null when the new candidates contain the locked notes: locks
       * remapped onto those notes so badges and unlocking survive the swap.
       */
      locks: ConstraintLock[] | null;
    }
  | { kind: 'empty' };

/**
 * Remap resolved lock values onto matching notes (same voice, span, pitch) in
 * a new candidate list. Deterministic ids/dates — this runs inside the reducer.
 */
function remapLocksOnto(
  entries: LockSignatureEntry[],
  candidates: CandidatePath[],
  createdAt: string,
): ConstraintLock[] {
  const remapped: ConstraintLock[] = [];
  for (const candidate of candidates) {
    for (const entry of entries) {
      const event = candidate.voicing[entry.voice].find((voiceEvent) => {
        const span = toTimelineSpan(voiceEvent.start, voiceEvent.duration);
        return (
          span.startUnit - 1 === entry.startUnit &&
          span.spanUnits === entry.units &&
          voiceEvent.pitch.midi === entry.pitch.midi
        );
      });
      if (event) {
        remapped.push({
          id: `lockset-${candidate.id}-${event.id}`,
          targetType: 'voice_event',
          targetId: event.id,
          candidateId: candidate.id,
          valueSnapshot: event,
          createdAt,
        });
      }
    }
  }
  return remapped;
}

export function resolveSuggestions(input: SuggestInput): SuggestionResolution {
  if (input.fragment.events.length === 0) return { kind: 'empty' };

  const voiceLocks = input.locks.filter((lock) => lock.targetType === 'voice_event');
  const entries = voiceLocks.length > 0 ? resolveLockEntries(voiceLocks, input.candidates) : [];
  const lockedPitches: LockedPitchConstraint[] = entries.map((entry) => ({
    startUnit: entry.startUnit,
    units: entry.units,
    pitchClass: entry.pitch.pitchClass,
    voice: entry.voice,
    pitch: entry.pitch,
    scaleDegree: entry.scaleDegree,
  }));
  const approach = approachFromAccepted(input.acceptedContext);

  // 1. The engine leads, locks or no locks.
  const generated = assembleSkeletons(
    input.fragment,
    input.tonalContext,
    input.phraseIntent,
    lockedPitches,
    input.boundaryConstraints,
    approach,
  );
  if (generated.length > 0) {
    const remapped =
      entries.length > 0 ? remapLocksOnto(entries, generated, 'computed-sketch') : [];
    return {
      kind: 'replace',
      candidates: generated,
      candidateSetId: null,
      sourceFixtureId: input.sourceFixtureId,
      suggestionSource: 'computed',
      boundaryConstraints: null,
      locks: remapped.length > 0 ? remapped : null,
    };
  }

  // 2. Unsupported context — authored fixtures beat an empty screen.
  const fixture = matchFixture(input.fixtures, {
    tonicPitchClass: input.tonalContext.tonicPitchClass,
    mode: input.tonalContext.mode,
    melodySignature: melodySignature(input.fragment.events),
  });
  if (fixture) {
    const set = defaultCandidateSet(fixture);
    return {
      kind: 'replace',
      candidates: set.candidates,
      candidateSetId: set.id,
      sourceFixtureId: fixture.id,
      suggestionSource: 'authored',
      boundaryConstraints: fixture.initialState.boundaryConstraints,
      locks: null,
    };
  }

  return { kind: 'empty' };
}
