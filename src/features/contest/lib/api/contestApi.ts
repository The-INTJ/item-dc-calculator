import type { Contest, Entry, ScoreBreakdown, ScoreEntry, UserRole } from '../../contexts/contest/contestTypes';
import { apiRequest } from './request';

export const contestApi = {
  async listContests(): Promise<{ contests: Contest[]; currentContest: Contest | null } | null> {
    try {
      return await apiRequest<{ contests: Contest[]; currentContest: Contest | null }>(
        '/api/contest/contests',
      );
    } catch (error) {
      console.error('Contest data operation failed:', error);
      return null;
    }
  },

  async getContest(id: string): Promise<Contest | null> {
    try {
      return await apiRequest<Contest>(`/api/contest/contests/${id}`);
    } catch {
      return null;
    }
  },

  async createContest(data: Partial<Contest>): Promise<Contest | null> {
    try {
      return await apiRequest<Contest>('/api/contest/contests', {
        method: 'POST',
        body: data,
      });
    } catch {
      return null;
    }
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<Contest | null> {
    try {
      return await apiRequest<Contest>(`/api/contest/contests/${id}`, {
        method: 'PATCH',
        body: updates,
      });
    } catch {
      return null;
    }
  },

  async deleteContest(id: string): Promise<boolean> {
    try {
      await apiRequest<{ success: true }>(`/api/contest/contests/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return false;
    }
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<Entry | null> {
    try {
      return await apiRequest<Entry>(`/api/contest/contests/${contestId}/entries`, {
        method: 'POST',
        body: entry,
      });
    } catch {
      return null;
    }
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<Entry | null> {
    try {
      return await apiRequest<Entry>(`/api/contest/contests/${contestId}/entries/${entryId}`, {
        method: 'PATCH',
        body: updates,
      });
    } catch {
      return null;
    }
  },

  async deleteEntry(contestId: string, entryId: string): Promise<boolean> {
    try {
      await apiRequest<{ success: true }>(`/api/contest/contests/${contestId}/entries/${entryId}`, {
        method: 'DELETE',
      });
      return true;
    } catch {
      return false;
    }
  },

  async getScoresForUser(contestId: string, userId: string): Promise<ScoreEntry[]> {
    try {
      const result = await apiRequest<{ scores: ScoreEntry[] }>(
        `/api/contest/contests/${contestId}/scores?userId=${encodeURIComponent(userId)}`,
      );
      return result.scores ?? [];
    } catch {
      return [];
    }
  },

  async getScoresForEntry(contestId: string, entryId: string): Promise<ScoreEntry[]> {
    try {
      const result = await apiRequest<{ scores: ScoreEntry[] }>(
        `/api/contest/contests/${contestId}/scores?entryId=${encodeURIComponent(entryId)}`,
      );
      return result.scores ?? [];
    } catch {
      return [];
    }
  },

  async submitScore(contestId: string, data: {
    entryId: string;
    userId: string;
    userName?: string;
    userRole?: UserRole;
    breakdown: Partial<ScoreBreakdown>;
    round?: string;
    notes?: string;
  }): Promise<ScoreEntry | null> {
    try {
      return await apiRequest<ScoreEntry>(`/api/contest/contests/${contestId}/scores`, {
        method: 'POST',
        body: data,
      });
    } catch {
      return null;
    }
  },
};
