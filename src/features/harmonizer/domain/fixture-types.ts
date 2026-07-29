/**
 * Fixture architecture types — spec §17.1, with two adaptations:
 * - `initialState` is a concrete FixtureInitialState (what fixtures actually
 *   provide) instead of Partial<WorkbenchState>, so it validates strictly.
 * - Match criteria narrow TonalContext to the fields the §17.3 sample matches
 *   on (tonicPitchClass + mode).
 */

import type { CandidatePath } from './analysis-types';
import type {
  BoundaryConstraint,
  MelodyFragment,
  PhraseIntent,
  TonalContext,
} from './music-types';
import type { AcceptedContext } from './workbench-state';

export type TonalContextMatch = Pick<TonalContext, 'tonicPitchClass' | 'mode'>;

export interface FixtureMatchCriteria {
  tonalContext: TonalContextMatch;
  /** e.g. "sol4:q|fa4:q|mi4:h" — see domain/signatures.ts */
  melodySignature: string;
  /** Ranking signal only — never used to filter matches (spec §9.2). */
  phraseIntent?: PhraseIntent;
  /** e.g. "I:root"; omitted = matches any accepted harmony (wildcard). */
  acceptedHarmonySignature?: string;
}

/** What a fixture provides to seed the workbench. */
export interface FixtureInitialState {
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  tempoBpm: number;
  acceptedContext: AcceptedContext;
  fragment: MelodyFragment;
  boundaryConstraints: BoundaryConstraint[];
}

export interface FixtureCandidateSet {
  id: string;
  /** Lock combination this set satisfies; the default set omits it. */
  lockSignature?: string;
  candidates: CandidatePath[];
}

export interface HarmonizationFixture {
  id: string;
  name: string;
  match: FixtureMatchCriteria;
  initialState: FixtureInitialState;
  candidateSets: FixtureCandidateSet[];
}
