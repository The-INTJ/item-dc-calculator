/**
 * Live suggestion resolution — the heart of the full POC. Pure and
 * deterministic; the reducer calls this on every relevant edit so suggestions
 * regenerate immediately (no stale state, no manual refresh).
 *
 * Resolution order:
 * 1. Locks present → authored lock-signature set within the current fixture,
 *    else computed skeletons filtered by the locked pitches. Spans no chord
 *    satisfies become honest `?` segments inside the skeletons (never a
 *    dead-end notice) — per Drew, the POC must SHOW what cannot be derived
 *    and why, not refuse.
 * 2. No locks → exact registry match (melody + tonal context + accepted
 *    harmony, fixture-side optional = wildcard; phrase intent NEVER filters —
 *    spec §9.2 calls intents ranking signals, not commands) → authored.
 * 3. No match → naive computed skeletons (the derivability probe).
 * 4. Nothing to work with → empty.
 */

import type { CandidatePath } from './analysis-types';
import { assembleSkeletons, type LockedPitchConstraint } from './enumerate';
import type { FixtureCandidateSet, HarmonizationFixture } from './fixture-types';
import {
  computeLockSignature,
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
import { acceptedHarmonySignature, melodySignature } from './signatures';
import { toTimelineSpan } from './timing';
import type { AcceptedContext } from './workbench-state';

export interface MatchCriteria {
  tonicPitchClass: number;
  mode: ModeId;
  melodySignature: string;
  acceptedHarmonySignature: string;
}

export function matchFixture(
  fixtures: readonly HarmonizationFixture[],
  criteria: MatchCriteria,
): HarmonizationFixture | null {
  return (
    fixtures.find(
      (fixture) =>
        fixture.match.tonalContext.tonicPitchClass === criteria.tonicPitchClass &&
        fixture.match.tonalContext.mode === criteria.mode &&
        fixture.match.melodySignature === criteria.melodySignature &&
        (fixture.match.acceptedHarmonySignature === undefined ||
          fixture.match.acceptedHarmonySignature === criteria.acceptedHarmonySignature),
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
       * Non-null when the new candidates contain the locked notes (authored
       * lock sets, and sketches that keep pinned notes in their lanes): locks
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
  if (voiceLocks.length > 0) {
    const signature = computeLockSignature(voiceLocks, input.candidates);
    const fixture =
      input.fixtures.find((entry) => entry.id === input.sourceFixtureId) ?? null;
    const authoredSet =
      fixture && signature
        ? (fixture.candidateSets.find((set) => set.lockSignature === signature) ?? null)
        : null;
    if (authoredSet && fixture) {
      // The signature guarantees each adopted candidate contains the locked
      // notes — remap so lock badges and value-based unlocking survive.
      const entries = resolveLockEntries(voiceLocks, input.candidates);
      return {
        kind: 'replace',
        candidates: authoredSet.candidates,
        candidateSetId: authoredSet.id,
        sourceFixtureId: fixture.id,
        suggestionSource: 'authored',
        boundaryConstraints: null,
        locks: remapLocksOnto(entries, authoredSet.candidates, 'authored-lock-set'),
      };
    }
    const entries = resolveLockEntries(voiceLocks, input.candidates);
    const lockedPitches: LockedPitchConstraint[] = entries.map((entry) => ({
      startUnit: entry.startUnit,
      units: entry.units,
      pitchClass: entry.pitch.pitchClass,
      voice: entry.voice,
      pitch: entry.pitch,
      scaleDegree: entry.scaleDegree,
    }));
    const skeletons = assembleSkeletons(
      input.fragment,
      input.tonalContext,
      input.phraseIntent,
      lockedPitches,
    );
    if (skeletons.length > 0) {
      // Sketches keep pinned notes in their lanes; when they do, remap the
      // locks onto them so the badges (and unlocking) follow the replacement.
      const remapped = remapLocksOnto(entries, skeletons, 'computed-sketch');
      return {
        kind: 'replace',
        candidates: skeletons,
        candidateSetId: null,
        sourceFixtureId: input.sourceFixtureId,
        suggestionSource: 'computed',
        boundaryConstraints: null,
        locks: remapped.length > 0 ? remapped : null,
      };
    }
    return { kind: 'empty' };
  }

  const fixture = matchFixture(input.fixtures, {
    tonicPitchClass: input.tonalContext.tonicPitchClass,
    mode: input.tonalContext.mode,
    melodySignature: melodySignature(input.fragment.events),
    acceptedHarmonySignature: acceptedHarmonySignature(
      input.acceptedContext.previousHarmony,
    ),
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

  const skeletons = assembleSkeletons(input.fragment, input.tonalContext, input.phraseIntent);
  if (skeletons.length > 0) {
    return {
      kind: 'replace',
      candidates: skeletons,
      candidateSetId: null,
      sourceFixtureId: input.sourceFixtureId,
      suggestionSource: 'computed',
      boundaryConstraints: null,
      locks: null,
    };
  }
  return { kind: 'empty' };
}
