import type { Contest, Entry, ScoreBreakdown, ScoreEntry, UserRole } from '../../contexts/contest/contestTypes';
import { fetchJson } from './fetchWithAuth';

const API = '/api/contest';

export const contestApi = {
  async listContests(): Promise<{ contests: Contest[]; currentContest: Contest | null } | null> {
    try {
      return await fetchJson<{ contests: Contest[]; currentContest: Contest | null }>(
        `${API}/contests`,
      );
    } catch (error) {
      console.error('Contest data operation failed:', error);
      return null;
    }
  },

  async getContest(id: string): Promise<Contest | null> {
    try {
      return await fetchJson<Contest>(`${API}/contests/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  },

  async createContest(data: Partial<Contest>): Promise<Contest | null> {
    try {
      return await fetchJson<Contest>(`${API}/contests`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return null;
    }
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<Contest | null> {
    try {
      return await fetchJson<Contest>(`${API}/contests/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch {
      return null;
    }
  },

  async deleteContest(id: string): Promise<boolean> {
    try {
      await fetchJson(`${API}/contests/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    } catch {
      return false;
    }
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<Entry | null> {
    try {
      return await fetchJson<Entry>(`${API}/contests/${encodeURIComponent(contestId)}/entries`, {
        method: 'POST',
        body: JSON.stringify(entry),
      });
    } catch {
      return null;
    }
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<Entry | null> {
    try {
      return await fetchJson<Entry>(
        `${API}/contests/${encodeURIComponent(contestId)}/entries/${encodeURIComponent(entryId)}`,
        { method: 'PATCH', body: JSON.stringify(updates) },
      );
    } catch {
      return null;
    }
  },

  async deleteEntry(contestId: string, entryId: string): Promise<boolean> {
    try {
      await fetchJson(
        `${API}/contests/${encodeURIComponent(contestId)}/entries/${encodeURIComponent(entryId)}`,
        { method: 'DELETE' },
      );
      return true;
    } catch {
      return false;
    }
  },

  async getScoresForUser(contestId: string, userId: string): Promise<ScoreEntry[]> {
    try {
      const params = new URLSearchParams({ userId });
      const data = await fetchJson<{ scores: ScoreEntry[] }>(
        `${API}/contests/${encodeURIComponent(contestId)}/scores?${params}`,
      );
      return data.scores;
    } catch {
      return [];
    }
  },

  async getScoresForEntry(contestId: string, entryId: string): Promise<ScoreEntry[]> {
    try {
      const params = new URLSearchParams({ entryId });
      const data = await fetchJson<{ scores: ScoreEntry[] }>(
        `${API}/contests/${encodeURIComponent(contestId)}/scores?${params}`,
      );
      return data.scores;
    } catch {
      return [];
    }
  },

  async registerAsContestant(
    contestId: string,
    userId: string,
    displayName: string,
    entryName?: string,
  ): Promise<boolean> {
    try {
      await fetchJson(`${API}/contests/${encodeURIComponent(contestId)}/register`, {
        method: 'POST',
        body: JSON.stringify({ displayName, entryName }),
      });
      return true;
    } catch {
      return false;
    }
  },

  async submitScore(
    contestId: string,
    data: {
      entryId: string;
      userId: string;
      userName?: string;
      userRole?: UserRole;
      breakdown: Partial<ScoreBreakdown>;
      round?: string;
      notes?: string;
    },
  ): Promise<ScoreEntry | null> {
    try {
      return await fetchJson<ScoreEntry>(
        `${API}/contests/${encodeURIComponent(contestId)}/scores`,
        { method: 'POST', body: JSON.stringify(data) },
      );
    } catch {
      return null;
    }
  },
};
