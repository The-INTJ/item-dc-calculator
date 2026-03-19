import type { Contest, Entry, ScoreBreakdown, ScoreEntry, UserRole } from '../../contexts/contest/contestTypes';
import { getClientBackendProvider } from '../firebase/clientBackendProvider';

async function getContestFromProvider(contestId: string): Promise<Contest | null> {
  const provider = await getClientBackendProvider();
  const result = await provider.contests.list();

  if (!result.success || !result.data) {
    return null;
  }

  return result.data.find((contest) => contest.id === contestId || contest.slug === contestId) ?? null;
}

export const contestApi = {
  async listContests(): Promise<{ contests: Contest[]; currentContest: Contest | null } | null> {
    try {
      const provider = await getClientBackendProvider();
      const [contestsResult, defaultResult] = await Promise.all([
        provider.contests.list(),
        provider.contests.getDefault(),
      ]);

      if (!contestsResult.success || !defaultResult.success) {
        return null;
      }

      return {
        contests: contestsResult.data ?? [],
        currentContest: defaultResult.data ?? null,
      };
    } catch (error) {
      console.error('Contest data operation failed:', error);
      return null;
    }
  },

  async getContest(id: string): Promise<Contest | null> {
    try {
      return await getContestFromProvider(id);
    } catch {
      return null;
    }
  },

  async createContest(data: Partial<Contest>): Promise<Contest | null> {
    try {
      const provider = await getClientBackendProvider();
      const result = await provider.contests.create(
        data as Omit<Contest, 'id' | 'entries' | 'voters'>,
      );
      return result.success ? (result.data ?? null) : null;
    } catch {
      return null;
    }
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<Contest | null> {
    try {
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(id);
      if (!contest) {
        return null;
      }

      const result = await provider.contests.update(contest.id, updates);
      return result.success ? (result.data ?? null) : null;
    } catch {
      return null;
    }
  },

  async deleteContest(id: string): Promise<boolean> {
    try {
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(id);
      if (!contest) {
        return false;
      }

      const result = await provider.contests.delete(contest.id);
      return result.success;
    } catch {
      return false;
    }
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<Entry | null> {
    try {
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(contestId);
      if (!contest) {
        return null;
      }

      const result = await provider.entries.create(contest.id, entry);
      return result.success ? (result.data ?? null) : null;
    } catch {
      return null;
    }
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<Entry | null> {
    try {
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(contestId);
      if (!contest) {
        return null;
      }

      const result = await provider.entries.update(contest.id, entryId, updates);
      return result.success ? (result.data ?? null) : null;
    } catch {
      return null;
    }
  },

  async deleteEntry(contestId: string, entryId: string): Promise<boolean> {
    try {
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(contestId);
      if (!contest) {
        return false;
      }

      const result = await provider.entries.delete(contest.id, entryId);
      return result.success;
    } catch {
      return false;
    }
  },

  async getScoresForUser(contestId: string, userId: string): Promise<ScoreEntry[]> {
    try {
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(contestId);
      if (!contest) {
        return [];
      }

      const result = await provider.scores.listByUser(contest.id, userId);
      return result.success ? (result.data ?? []) : [];
    } catch {
      return [];
    }
  },

  async getScoresForEntry(contestId: string, entryId: string): Promise<ScoreEntry[]> {
    try {
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(contestId);
      if (!contest) {
        return [];
      }

      const result = await provider.scores.listByEntry(contest.id, entryId);
      return result.success ? (result.data ?? []) : [];
    } catch {
      return [];
    }
  },

  async registerAsContestant(
    contestId: string,
    userId: string,
    displayName: string,
  ): Promise<boolean> {
    try {
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(contestId);
      if (!contest) return false;

      const existing = await provider.voters.getById(contest.id, userId);
      if (existing.success && existing.data) {
        const result = await provider.voters.update(contest.id, userId, { role: 'competitor' });
        return result.success;
      }

      const result = await provider.voters.create(contest.id, {
        id: userId,
        displayName,
        role: 'competitor',
      });
      return result.success;
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
      const provider = await getClientBackendProvider();
      const contest = await getContestFromProvider(contestId);
      if (!contest) {
        return null;
      }

      const voterResult = await provider.voters.getById(contest.id, data.userId);
      if (!voterResult.success || !voterResult.data) {
        await provider.voters.create(contest.id, {
          id: data.userId,
          displayName: data.userName ?? 'Guest',
          role: data.userRole ?? 'voter',
        });
      }

      const result = await provider.scores.submit(contest.id, {
        entryId: data.entryId,
        userId: data.userId,
        round: data.round ?? '',
        breakdown: data.breakdown as ScoreBreakdown,
        ...(data.notes ? { notes: data.notes } : {}),
      });

      return result.success ? (result.data ?? null) : null;
    } catch {
      return null;
    }
  },
};
