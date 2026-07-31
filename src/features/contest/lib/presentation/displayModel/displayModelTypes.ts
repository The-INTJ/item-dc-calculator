import type {
  MatchupPhase,
  RoundStatus,
} from '../../../contexts/contest/contestTypes';
import type { BracketStructure } from '../../domain/bracketMath';
import type { ContestDisplayKind } from '../displaySurface';

export type FeaturedMatchupMode = 'shake' | 'standby';

export interface DisplayContestant {
  id: string;
  name: string;
  score: number | null;
  /** Changes whenever the raw cached aggregate changes, even if rounded score is unchanged. */
  scoreSignature: string;
  isWinner: boolean;
}

export interface DisplayMatchup {
  id: string;
  contestantA: DisplayContestant;
  contestantB: DisplayContestant;
  winnerId: string | null;
  /** Indices of the feeder matchups from the previous round (1-2), or null for round 0. */
  sourceMatchups: number[] | null;
  /** Position within the round (for connector line layout). */
  slotIndex: number;
  /** Stored matchup document id (present when a stored matchup drives this slot). */
  matchupId?: string;
  /** Matchup lifecycle phase (present when a stored matchup drives this slot). */
  phase?: MatchupPhase;
  /** True when this is a single-entry bye (auto-advance). */
  isBye?: boolean;
}

export interface DisplayRound {
  id: string;
  name: string;
  status: RoundStatus;
  isActive: boolean;
  matchups: DisplayMatchup[];
  /** Expected number of matchups from bracket math (may exceed actual entries). */
  expectedMatchupCount: number;
  /** Zero-based position in the bracket (for CSS layout). */
  roundIndex: number;
}

export interface DisplayChampion {
  /** The winning contestant entry from the final matchup. */
  contestant: DisplayContestant;
  /** The opponent in the final matchup (for the runner-up callout). */
  runnerUp: DisplayContestant | null;
  finalRoundName: string;
}

export interface DisplayModel {
  contestId: string;
  contestName: string;
  contestKind: ContestDisplayKind;
  rounds: DisplayRound[];
  activeRoundId: string | null;
  activeRoundName: string | null;
  nextRoundName: string | null;
  activeShakeMatchup: DisplayMatchup | null;
  featuredMatchup: DisplayMatchup | null;
  featuredMatchupMode: FeaturedMatchupMode;
  totalRounds: number;
  phase: MatchupPhase;
  /** Bracket structure derived from the actual per-round matchup shape. */
  bracketStructure: BracketStructure;
  /** Rows every bracket column's grid must declare (shared across rounds). */
  gridRowCount: number;
  /** True when the active round is the final round in the bracket. */
  isFinalRoundActive: boolean;
  /**
   * Set when the last round is a true 1-matchup, non-bye final AND it is the
   * active round — the display swaps that column for the face-off panel.
   * Stays null for under-provisioned brackets whose "last" round still holds
   * multiple matchups.
   */
  faceOffRoundId: string | null;
  /** Set when the final round's matchup is scored with a winner — drives the crowning UI. */
  champion: DisplayChampion | null;
}
