import { fromProviderResult, jsonError, parseBody } from '../../_lib/http';
import { loadProvider } from '@/contest/lib/backend/serverProvider';
import { requireAuth } from '../../_lib/requireAuth';
import { UpdateProfileBodySchema } from '@/contest/lib/schemas';
import type { SelfProfileUpdates } from '@/contest/lib/backend/types';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const provider = await loadProvider();
  const result = await provider.profiles.get(auth.user.uid);

  if (!result.success) {
    return jsonError(result.error ?? 'Failed to load profile', 500);
  }
  if (!result.data) {
    return jsonError('Profile not found', 404);
  }
  return fromProviderResult(result);
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const body = await parseBody(request, UpdateProfileBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const updates: SelfProfileUpdates = {};
  if (typeof body.data.displayName === 'string') {
    const trimmed = body.data.displayName.trim();
    if (!trimmed) {
      return jsonError('displayName must not be empty', 400);
    }
    updates.displayName = trimmed;
  }
  if (typeof body.data.avatarUrl === 'string') {
    updates.avatarUrl = body.data.avatarUrl.trim() || undefined;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError('No valid fields to update', 400);
  }

  const provider = await loadProvider();
  const result = await provider.profiles.updateSelf(auth.user.uid, updates);
  return fromProviderResult(result);
}
