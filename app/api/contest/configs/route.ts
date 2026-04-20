import { fromProviderResult, jsonError, parseBody } from '../_lib/http';
import { loadProvider } from '@/contest/lib/backend/serverProvider';
import { requireAdmin } from '../_lib/requireAdmin';
import { CreateContestConfigBodySchema } from '@/contest/lib/schemas';

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

  const body = await parseBody(request, CreateContestConfigBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const provider = await loadProvider();
  const result = await provider.configs.create(body.data);

  return fromProviderResult(result, { failureStatus: 400, successStatus: 201 });
}
