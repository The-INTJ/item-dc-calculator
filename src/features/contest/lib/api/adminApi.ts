import type { Contest, Entry, ContestConfig, ContestConfigItem } from '../../contexts/contest/contestTypes';
import type { ProviderResult } from '../backend/types';
import { getClientBackendProvider } from '../firebase/clientBackendProvider';

async function runProviderRequest<T>(
  operation: (provider: Awaited<ReturnType<typeof getClientBackendProvider>>) => Promise<ProviderResult<T>>,
): Promise<ProviderResult<T>> {
  try {
    const provider = await getClientBackendProvider();
    return await operation(provider);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function resolveContest(id: string): Promise<ProviderResult<Contest>> {
  return runProviderRequest(async (provider) => {
    const result = await provider.contests.list();
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const contest = result.data?.find((candidate) => candidate.id === id || candidate.slug === id);
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }

    return { success: true, data: contest };
  });
}

export const adminApi = {
  async listContests(): Promise<ProviderResult<{ contests: Contest[]; currentContest: Contest | null }>> {
    return runProviderRequest(async (provider) => {
      const [contests, currentContest] = await Promise.all([
        provider.contests.list(),
        provider.contests.getDefault(),
      ]);

      if (!contests.success) {
        return { success: false, error: contests.error };
      }

      if (!currentContest.success) {
        return { success: false, error: currentContest.error };
      }

      return {
        success: true,
        data: {
          contests: contests.data ?? [],
          currentContest: currentContest.data ?? null,
        },
      };
    });
  },

  async getContest(id: string): Promise<ProviderResult<Contest>> {
    return resolveContest(id);
  },

  async createContest(data: Omit<Contest, 'id' | 'entries' | 'voters'>): Promise<ProviderResult<Contest>> {
    return runProviderRequest((provider) => provider.contests.create(data));
  },

  async updateContest(id: string, updates: Partial<Contest>): Promise<ProviderResult<Contest>> {
    const contestResult = await resolveContest(id);
    if (!contestResult.success || !contestResult.data) {
      return { success: false, error: contestResult.error ?? 'Contest not found' };
    }

    return runProviderRequest((provider) => provider.contests.update(contestResult.data!.id, updates));
  },

  async deleteContest(id: string): Promise<ProviderResult<void>> {
    const contestResult = await resolveContest(id);
    if (!contestResult.success || !contestResult.data) {
      return { success: false, error: contestResult.error ?? 'Contest not found' };
    }

    return runProviderRequest((provider) => provider.contests.delete(contestResult.data!.id));
  },

  async updateContestConfig(id: string, config: ContestConfig): Promise<ProviderResult<Contest>> {
    return adminApi.updateContest(id, { config });
  },

  async listEntries(contestId: string): Promise<ProviderResult<Entry[]>> {
    const contestResult = await resolveContest(contestId);
    if (!contestResult.success || !contestResult.data) {
      return { success: false, error: contestResult.error ?? 'Contest not found' };
    }

    return runProviderRequest((provider) => provider.entries.listByContest(contestResult.data!.id));
  },

  async getEntry(contestId: string, entryId: string): Promise<ProviderResult<Entry>> {
    const contestResult = await resolveContest(contestId);
    if (!contestResult.success || !contestResult.data) {
      return { success: false, error: contestResult.error ?? 'Contest not found' };
    }

    return runProviderRequest(async (provider) => {
      const result = await provider.entries.getById(contestResult.data!.id, entryId);
      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? 'Entry not found' };
      }

      return { success: true, data: result.data };
    });
  },

  async createEntry(contestId: string, entry: Omit<Entry, 'id'>): Promise<ProviderResult<Entry>> {
    const contestResult = await resolveContest(contestId);
    if (!contestResult.success || !contestResult.data) {
      return { success: false, error: contestResult.error ?? 'Contest not found' };
    }

    return runProviderRequest((provider) => provider.entries.create(contestResult.data!.id, entry));
  },

  async updateEntry(contestId: string, entryId: string, updates: Partial<Entry>): Promise<ProviderResult<Entry>> {
    const contestResult = await resolveContest(contestId);
    if (!contestResult.success || !contestResult.data) {
      return { success: false, error: contestResult.error ?? 'Contest not found' };
    }

    return runProviderRequest((provider) =>
      provider.entries.update(contestResult.data!.id, entryId, updates),
    );
  },

  async deleteEntry(contestId: string, entryId: string): Promise<ProviderResult<void>> {
    const contestResult = await resolveContest(contestId);
    if (!contestResult.success || !contestResult.data) {
      return { success: false, error: contestResult.error ?? 'Contest not found' };
    }

    return runProviderRequest((provider) => provider.entries.delete(contestResult.data!.id, entryId));
  },

  async listConfigs(): Promise<ProviderResult<ContestConfigItem[]>> {
    return runProviderRequest((provider) => provider.configs.list());
  },

  async createConfig(
    config: Omit<ContestConfigItem, 'id'> & { id?: string },
  ): Promise<ProviderResult<ContestConfigItem>> {
    return runProviderRequest((provider) => provider.configs.create(config));
  },
};
