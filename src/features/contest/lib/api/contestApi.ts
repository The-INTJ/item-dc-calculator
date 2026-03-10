import type { Contest, Entry, ScoreEntry, ScoreBreakdown, UserRole } from '../../contexts/contest/contestTypes';
import { getClientBackendProvider } from '../firebase/clientBackendProvider';

async function runProviderCall<T>(
  operation: (provider: Awaited<ReturnType<typeof getClientBackendProvider>>) => Promise<T>,
): Promise<T | null> {
  try {
    const provider = await getClientBackendProvider();
    return await operation(provider);
  } catch (err) {
    console.error('Contest data operation failed:', err);
    return null;
  }
}

export const contestApi = {
  async listContests(): Promise<{ contests: Contest[]; currentContest: Contest | null } | null> {
    return runProviderCall(async (provider) => {
      const [contestsResult, currentContestResult] = await Promise.all([
        provider.contests.list(),
        provider.contests.getDefault(),
      ]);

      if (!contestsResult.success || !currentContestResult.success) {
        return null;
      }

      return {
        contests: contestsResult.data ?? [],
        currentContest: currentContestResult.data ?? null,
      };
    });
  },

  async getContest(id: string): Promise<Contest | null> {
    return runProviderCall(async (provider) => {
      const result = await provider.contests.list();
      if (!result.success) {
        return null;
      }

      return result.data?.find((contest) => contest.id === id || contest.slug === id) ?? null;
    });
  },

  async createContest(data: Partial<Contest>): Promise<Contest | null> {
    return runProviderCall(async (provider) => {
      const result = await provider.contests.create({
        name: data.name ?? '',
        slug: data.slug ?? '',
        phase: data.phase ?? 'set',
        config: data.config,
        location: data.location,
        startTime: data.startTime,
        bracketRound: data.bracketRound,
        currentEntryId: data.currentEntryId,
        defaultContest: data.defaultContest,
        rounds: data.rounds,
        activeRoundId: data.activeRoundId,
        futureRoundId: data.futureRoundId,
      });

      return result.success ? (result.data ?? null) : null;
    });
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<Contest | null> {
    return runProviderCall(async (provider) => {
      const result = await provider.contests.update(id, updates);
      return result.success ? (result.data ?? null) : null;
    });
  },

  async deleteContest(id: string): Promise<boolean> {
    return runProviderCall(async (provider) => {
      const result = await provider.contests.delete(id);
      return result.success;
    }).then((result) => result ?? false);
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<Entry | null> {
    return runProviderCall(async (provider) => {
      const result = await provider.entries.create(contestId, entry);
      return result.success ? (result.data ?? null) : null;
    });
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<Entry | null> {
    return runProviderCall(async (provider) => {
      const result = await provider.entries.update(contestId, entryId, updates);
      return result.success ? (result.data ?? null) : null;
    });
  },

  async deleteEntry(contestId: string, entryId: string): Promise<boolean> {
    return runProviderCall(async (provider) => {
      const result = await provider.entries.delete(contestId, entryId);
      return result.success;
    }).then((result) => result ?? false);
  },

  async getScoresForUser(contestId: string, userId: string): Promise<ScoreEntry[]> {
    const result = await runProviderCall(async (provider) => {
      const response = await provider.scores.listByUser(contestId, userId);
      return response.success ? (response.data ?? []) : [];
    });
    return result ?? [];
  },

  async getScoresForEntry(contestId: string, entryId: string): Promise<ScoreEntry[]> {
    const result = await runProviderCall(async (provider) => {
      const response = await provider.scores.listByEntry(contestId, entryId);
      return response.success ? (response.data ?? []) : [];
    });
    return result ?? [];
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
    return runProviderCall(async (provider) => {
      const result = await provider.scores.submit(contestId, {
        entryId: data.entryId,
        userId: data.userId,
        round: data.round ?? '',
        breakdown: data.breakdown as ScoreBreakdown,
        ...(data.notes ? { notes: data.notes } : {}),
      });

      return result.success ? (result.data ?? null) : null;
    });
  },
};
