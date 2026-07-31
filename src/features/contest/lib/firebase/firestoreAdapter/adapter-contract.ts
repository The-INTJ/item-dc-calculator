import type { Contest, ContestConfigItem, Matchup, ScoreEntry } from '../../../contexts/contest/contestTypes';
import type { BallotInput, MatchupCreateInput, ScoreUpdatePayload, UserProfile } from '../../backend/types';

/**
 * SDK-agnostic adapter interface for contest/config/score operations.
 */
export interface FirestoreAdapter {
  /** True iff the underlying database connection is initialized. */
  isReady(): boolean;

  // ---- Contests ----
  getContest(contestId: string): Promise<Contest | null>;
  getContestBySlug(slug: string): Promise<Contest | null>;
  getDefaultContest(): Promise<Contest | null>;
  listContests(): Promise<Contest[]>;
  createContest(id: string, data: Omit<Contest, 'id'>): Promise<void>;
  updateContest(contestId: string, updates: Partial<Contest>): Promise<void>;
  deleteContest(contestId: string): Promise<void>;

  // ---- Configs ----
  getConfig(configId: string): Promise<ContestConfigItem | null>;
  listConfigs(): Promise<ContestConfigItem[]>;
  configExists(configId: string): Promise<boolean>;
  createConfig(id: string, data: Omit<ContestConfigItem, 'id'>): Promise<void>;
  updateConfig(configId: string, updates: Partial<ContestConfigItem>): Promise<ContestConfigItem>;
  deleteConfig(configId: string): Promise<void>;

  // ---- Scores / votes ----
  listScoresByEntry(contestId: string, entryId: string): Promise<ScoreEntry[]>;
  listScoresByUser(contestId: string, userId: string): Promise<ScoreEntry[]>;
  getScore(contestId: string, scoreId: string): Promise<ScoreEntry | null>;
  submitScore(contestId: string, input: Omit<ScoreEntry, 'id'>): Promise<ScoreEntry>;
  /** Submit a whole matchup ballot atomically — all entries land or none do. */
  submitBallot(contestId: string, input: BallotInput): Promise<ScoreEntry[]>;
  updateScore(contestId: string, scoreId: string, updates: ScoreUpdatePayload): Promise<ScoreEntry>;
  deleteScore(contestId: string, scoreId: string): Promise<void>;

  // ---- Contestant cascade ----
  /** Remove a contestant plus their matchup entries/votes-on-entries. */
  removeContestantCascade(contestId: string, contestantId: string): Promise<void>;

  // ---- Matchups ----
  listMatchups(contestId: string): Promise<Matchup[]>;
  listMatchupsByRound(contestId: string, roundId: string): Promise<Matchup[]>;
  getMatchup(contestId: string, matchupId: string): Promise<Matchup | null>;
  createMatchup(contestId: string, matchup: MatchupCreateInput): Promise<Matchup>;
  updateMatchup(contestId: string, matchupId: string, updates: Partial<Matchup>): Promise<Matchup>;
  deleteMatchup(contestId: string, matchupId: string): Promise<void>;
  batchCreateMatchups(contestId: string, matchups: MatchupCreateInput[]): Promise<Matchup[]>;
  setMatchupEntryName(
    contestId: string,
    matchupId: string,
    entryId: string,
    payload: { name: string; description?: string },
  ): Promise<Matchup>;

  // ---- User profiles ----
  getProfile(uid: string): Promise<UserProfile | null>;
  upsertProfile(uid: string, profile: UserProfile): Promise<UserProfile>;
  updateProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile>;
}
