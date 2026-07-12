import type {
  Contest,
  Contestant,
  ContestConfig,
  ContestConfigItem,
  ContestRound,
  Matchup,
  ScoreBreakdown,
  ScoreEntry,
  UserRole,
} from '../../contexts/contest/contestTypes';
import type { UserProfile } from '../../contexts/auth/types';
import type { MatchupCreateInput, ProviderResult } from '../backend/types';
import { fetchProviderResult } from './fetchWithAuth';

const API = '/api/contest';

type ContestListResponse = { contests: Contest[]; currentContest: Contest | null };

/**
 * Unified client for the contest API. Every method returns a `ProviderResult`,
 * so callers handle success/error uniformly (and can't confuse "not loaded"
 * with "failed"). There is no separate admin client — admin-only endpoints
 * enforce their own auth server-side via `requireAdmin`.
 */
export const contestApi = {
  // ── Auth / profile ──────────────────────────────────────────────────────
  async getProfile(): Promise<ProviderResult<UserProfile>> {
    return fetchProviderResult<UserProfile>(`${API}/auth/profile`);
  },

  async registerProfile(
    data: { displayName?: string; email?: string; avatarUrl?: string } = {},
  ): Promise<ProviderResult<UserProfile>> {
    return fetchProviderResult<UserProfile>(`${API}/auth/register-profile`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfile(
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>,
  ): Promise<ProviderResult<UserProfile>> {
    return fetchProviderResult<UserProfile>(`${API}/auth/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // ── Contests ────────────────────────────────────────────────────────────
  async listContests(): Promise<ProviderResult<ContestListResponse>> {
    return fetchProviderResult<ContestListResponse>(`${API}/contests`);
  },

  async getContest(id: string): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(`${API}/contests/${encodeURIComponent(id)}`);
  },

  async createContest(
    data: Omit<Contest, 'id' | 'contestants' | 'voters'>,
  ): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(`${API}/contests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(`${API}/contests/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteContest(id: string): Promise<ProviderResult<void>> {
    return fetchProviderResult<void>(`${API}/contests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async updateContestConfig(id: string, config: ContestConfig): Promise<ProviderResult<Contest>> {
    return contestApi.updateContest(id, { config });
  },

  // ── Contestants ─────────────────────────────────────────────────────────
  async listContestants(contestId: string): Promise<ProviderResult<Contestant[]>> {
    return fetchProviderResult<Contestant[]>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants`,
    );
  },

  async getContestant(contestId: string, contestantId: string): Promise<ProviderResult<Contestant>> {
    return fetchProviderResult<Contestant>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants/${encodeURIComponent(contestantId)}`,
    );
  },

  async createContestant(
    contestId: string,
    contestant: Omit<Contestant, 'id'>,
  ): Promise<ProviderResult<Contestant>> {
    return fetchProviderResult<Contestant>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants`,
      { method: 'POST', body: JSON.stringify(contestant) },
    );
  },

  async updateContestant(
    contestId: string,
    contestantId: string,
    updates: Partial<Contestant>,
  ): Promise<ProviderResult<Contestant>> {
    return fetchProviderResult<Contestant>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants/${encodeURIComponent(contestantId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
    );
  },

  async deleteContestant(contestId: string, contestantId: string): Promise<ProviderResult<void>> {
    return fetchProviderResult<void>(
      `${API}/contests/${encodeURIComponent(contestId)}/contestants/${encodeURIComponent(contestantId)}`,
      { method: 'DELETE' },
    );
  },

  async setMatchupEntryName(
    contestId: string,
    matchupId: string,
    entryId: string,
    payload: { name: string; description?: string },
  ): Promise<ProviderResult<Matchup>> {
    return fetchProviderResult<Matchup>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}/entries/${encodeURIComponent(entryId)}`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
  },

  // ── Scores ──────────────────────────────────────────────────────────────
  async getScoresForUser(contestId: string, userId: string): Promise<ProviderResult<ScoreEntry[]>> {
    const params = new URLSearchParams({ userId });
    const result = await fetchProviderResult<{ scores: ScoreEntry[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/scores?${params}`,
    );
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data?.scores ?? [] };
  },

  async getScoresForEntry(contestId: string, entryId: string): Promise<ProviderResult<ScoreEntry[]>> {
    const params = new URLSearchParams({ entryId });
    const result = await fetchProviderResult<{ scores: ScoreEntry[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/scores?${params}`,
    );
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data?.scores ?? [] };
  },

  async submitScore(
    contestId: string,
    data: {
      entryId: string;
      /**
       * Matchup this vote belongs to. Required server-side; optional here only
       * so existing call sites compile during the matchup refactor. PR 6
       * rewrites `useRoundVoting` to always pass a `matchupId`.
       */
      matchupId?: string;
      userName?: string;
      userRole?: UserRole;
      breakdown: Partial<ScoreBreakdown>;
      notes?: string;
    },
  ): Promise<ProviderResult<ScoreEntry>> {
    return fetchProviderResult<ScoreEntry>(
      `${API}/contests/${encodeURIComponent(contestId)}/scores`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  },

  /**
   * Submit a complete matchup ballot atomically. If the matchup closed while
   * the voter was scoring, the whole ballot is rejected with
   * `errorCode: MATCHUP_CLOSED` — no partial ballots.
   */
  async submitBallot(
    contestId: string,
    matchupId: string,
    data: {
      userName?: string;
      userRole?: UserRole;
      scores: Array<{ entryId: string; breakdown: ScoreBreakdown }>;
    },
  ): Promise<ProviderResult<{ scores: ScoreEntry[] }>> {
    return fetchProviderResult<{ scores: ScoreEntry[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}/ballot`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  },

  // ── Matchups ────────────────────────────────────────────────────────────
  async listMatchups(
    contestId: string,
    options: { roundId?: string } = {},
  ): Promise<ProviderResult<Matchup[]>> {
    const qs = options.roundId
      ? `?${new URLSearchParams({ roundId: options.roundId }).toString()}`
      : '';
    const result = await fetchProviderResult<{ matchups: Matchup[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups${qs}`,
    );
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result.data?.matchups ?? [] };
  },

  async getMatchup(contestId: string, matchupId: string): Promise<ProviderResult<Matchup>> {
    return fetchProviderResult<Matchup>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}`,
    );
  },

  async createMatchup(
    contestId: string,
    matchup: MatchupCreateInput,
  ): Promise<ProviderResult<Matchup>> {
    return fetchProviderResult<Matchup>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups`,
      { method: 'POST', body: JSON.stringify(matchup) },
    );
  },

  async updateMatchup(
    contestId: string,
    matchupId: string,
    updates: Partial<Matchup>,
  ): Promise<ProviderResult<Matchup>> {
    return fetchProviderResult<Matchup>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
    );
  },

  async deleteMatchup(contestId: string, matchupId: string): Promise<ProviderResult<void>> {
    return fetchProviderResult<void>(
      `${API}/contests/${encodeURIComponent(contestId)}/matchups/${encodeURIComponent(matchupId)}`,
      { method: 'DELETE' },
    );
  },

  // ── Rounds ──────────────────────────────────────────────────────────────
  async updateRound(
    contestId: string,
    roundId: string,
    updates: Partial<ContestRound>,
  ): Promise<ProviderResult<Contest>> {
    return fetchProviderResult<Contest>(
      `${API}/contests/${encodeURIComponent(contestId)}/rounds/${encodeURIComponent(roundId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
    );
  },

  async seedRound(
    contestId: string,
    roundId: string,
    body: { entryIdPairs?: Array<[string, string] | [string]> } = {},
  ): Promise<ProviderResult<{ matchups: Matchup[] }>> {
    return fetchProviderResult<{ matchups: Matchup[] }>(
      `${API}/contests/${encodeURIComponent(contestId)}/rounds/${encodeURIComponent(roundId)}/seed`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  },

  // ── Register / configs ──────────────────────────────────────────────────
  async registerAsContestant(
    contestId: string,
    displayName: string,
  ): Promise<ProviderResult<{ registered: boolean; contestantId?: string }>> {
    return fetchProviderResult<{ registered: boolean; contestantId?: string }>(
      `${API}/contests/${encodeURIComponent(contestId)}/register`,
      { method: 'POST', body: JSON.stringify({ displayName }) },
    );
  },

  async listConfigs(): Promise<ProviderResult<ContestConfigItem[]>> {
    return fetchProviderResult<ContestConfigItem[]>(`${API}/configs`);
  },

  async createConfig(
    config: Omit<ContestConfigItem, 'id'> & { id?: string },
  ): Promise<ProviderResult<ContestConfigItem>> {
    return fetchProviderResult<ContestConfigItem>(`${API}/configs`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },
};
