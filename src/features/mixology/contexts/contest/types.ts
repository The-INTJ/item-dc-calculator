import type { Contest, ContestPhase, ContestRound, Entry, ScoreBreakdown } from '../../lib/globals/types';

// ─────────────────────────────────────────────────────────────────────────────
// Vote Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Vote {
  contestId: string;
  drinkId: string;
  score: number;
  breakdown?: ScoreBreakdown;
  naSections?: string[];
  notes?: string;
  timestamp: number;
}

export type VoteInput = Omit<Vote, 'timestamp'>;

// ─────────────────────────────────────────────────────────────────────────────
// Contest State
// ─────────────────────────────────────────────────────────────────────────────

export interface ContestState {
  contests: Contest[];
  activeContestId: string | null;
  lastUpdatedAt: number | null;
}

export type ContestStateUpdater = (prev: ContestState) => ContestState;

export interface ContestContextValue extends ContestState {
  updateState: (updater: ContestStateUpdater) => void;
  refresh: () => void;
}

export interface ContestActions {
  setActiveContest: (contestId: string) => void;
  updateContest: (contestId: string, updates: Partial<Contest>) => void;
  upsertContest: (contest: Contest) => void;
  addContest: (name: string) => Promise<Contest | null>;
  deleteContest: (contestId: string) => Promise<boolean>;
  addRound: (contestId: string) => Promise<boolean>;
  updateRound: (contestId: string, roundId: string, updates: Partial<ContestRound>) => Promise<boolean>;
  removeRound: (contestId: string, roundId: string) => Promise<boolean>;
  setActiveRound: (contestId: string, roundId: string) => Promise<boolean>;
  setRoundState: (contestId: string, roundId: string, state: ContestPhase) => Promise<boolean>;
  addMixologist: (contestId: string, mixologist: { name: string; drinkName: string; roundId: string }) => Promise<Entry | null>;
  updateMixologist: (contestId: string, drinkId: string, updates: Partial<Entry>) => Promise<Entry | null>;
  removeMixologist: (contestId: string, drinkId: string) => Promise<boolean>;
}

export interface VotingActions {
  recordVote: (vote: VoteInput) => Promise<void>;
}
