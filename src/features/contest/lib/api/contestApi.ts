import type {
  Contest,
  ContestConfig,
  ContestConfigItem,
  ContestRound,
  Entry,
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
    data: Omit<Contest, 'id' | 'entries' | 'voters'>,
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

  // ── Entries ─────────────────────────────────────────────────────────────
  async listEntries(contestId: string): Promise<ProviderResult<Entry[]>> {
    return fetchProviderResult<Entry[]>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries`,
    );
  },

  async getEntry(contestId: string, entryId: string): Promise<ProviderResult<Entry>> {
    return fetchProviderResult<Entry>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries/${encodeURIComponent(entryId)}`,
    );
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<ProviderResult<Entry>> {
    return fetchProviderResult<Entry>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries`,
      { method: 'POST', body: JSON.stringify(entry) },
    );
  },

  async updateEntry(
    contestId: string,
    entryId: string,
    updates: Partial<Entry>,
  ): Promise<ProviderResult<Entry>> {
    return fetchProviderResult<Entry>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries/${encodeURIComponent(entryId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) },
    );
  },

  async deleteEntry(contestId: string, entryId: string): Promise<ProviderResult<void>> {
    return fetchProviderResult<void>(
      `${API}/contests/${encodeURIComponent(contestId)}/entries/${encodeURIComponent(entryId)}`,
      { method: 'DELETE' },
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
    body: { entryIdPairs?: Array<[string, string]> } = {},
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
    entryName?: string,
  ): Promise<ProviderResult<{ registered: boolean }>> {
    return fetchProviderResult<{ registered: boolean }>(
      `${API}/contests/${encodeURIComponent(contestId)}/register`,
      { method: 'POST', body: JSON.stringify({ displayName, entryName }) },
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
