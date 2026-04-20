import 'server-only';

import { getBackendProvider } from './providerFactory';
import type { BackendProvider, Contest } from './types';

/**
 * Resolve the shared backend provider (server-only).
 *
 * API routes and server components both call this — the provider picks up the
 * Admin SDK automatically when running on the server. Don't import this from
 * client code; the `server-only` import above will fail the build.
 */
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
