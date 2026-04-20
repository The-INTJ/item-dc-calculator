import { jsonError, jsonSuccess } from '../_lib/http';
import { loadProvider } from '@/contest/lib/backend/serverProvider';

export async function GET() {
  const provider = await loadProvider();
  const result = await provider.contests.getDefault();

  if (!result.success) {
    return jsonError(result.error ?? 'Failed to load contest', 500);
  }

  return jsonSuccess({ currentContest: result.data ?? null });
}
