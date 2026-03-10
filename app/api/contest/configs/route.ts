import { fromProviderResult, jsonError, readJsonBody } from '../_lib/http';
import { loadProvider } from '../_lib/provider';
import { requireAdmin } from '../_lib/requireAdmin';
import type { ContestConfigItem } from '@/contest/contexts/contest/contestTypes';

export async function GET() {
  const provider = await loadProvider();

  const result = await provider.configs.list();
  if (!result.success) {
    return jsonError(result.error ?? 'Failed to load configs', 500);
  }

  return fromProviderResult(result, { failureStatus: 500 });
}

export async function POST(request: Request) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const body = await readJsonBody<Omit<ContestConfigItem, 'id'> & { id?: string }>(request);
  if (!body.ok) {
    return body.response;
  }

  const provider = await loadProvider();
  const result = await provider.configs.create(body.data);

  return fromProviderResult(result, { failureStatus: 400, successStatus: 201 });
}
