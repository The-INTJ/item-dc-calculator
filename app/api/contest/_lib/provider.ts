import { getBackendProvider } from '@/contest/lib/backend/providerFactory';
import type { BackendProvider, Contest } from '@/contest/lib/backend/types';

export async function loadProvider(): Promise<BackendProvider> {
  return getBackendProvider();
}

export async function getContestByParam(contestParam: string): Promise<{
  provider: BackendProvider;
  contest: Contest | null;
  error: string | null;
}> {
  const provider = await loadProvider();
  const contestsResult = await provider.contests.list();

  if (!contestsResult.success || !contestsResult.data) {
    return {
      provider,
      contest: null,
      error: contestsResult.error ?? 'Failed to fetch contests',
    };
  }

  const contest = contestsResult.data.find(
    (item) => item.id === contestParam || item.slug === contestParam,
  ) ?? null;

  return {
    provider,
    contest,
    error: contest ? null : 'Contest not found',
  };
}
