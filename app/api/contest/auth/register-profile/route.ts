import { fromProviderResult, jsonError, parseBody } from '../../_lib/http';
import { loadProvider } from '@/contest/lib/backend/serverProvider';
import { requireAuth } from '../../_lib/requireAuth';
import { RegisterProfileBodySchema } from '@/contest/lib/schemas';
import type { UserProfile } from '@/contest/lib/backend/types';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) {
    return auth.response;
  }

  const body = await parseBody(request, RegisterProfileBodySchema);
  if (!body.ok) {
    return body.response;
  }

  const provider = await loadProvider();
  const existing = await provider.profiles.get(auth.user.uid);
  if (!existing.success) {
    return jsonError(existing.error ?? 'Failed to load profile', 500);
  }

  if (existing.data) {
    return fromProviderResult({ success: true, data: existing.data });
  }

  const displayName =
    body.data.displayName?.trim() ||
    auth.user.displayName ||
    auth.user.email?.split('@')[0] ||
    'Contest User';

  const profile: UserProfile = {
    displayName,
    role: 'voter',
    ...(body.data.email?.trim() ? { email: body.data.email.trim() } : auth.user.email ? { email: auth.user.email } : {}),
    ...(body.data.avatarUrl?.trim() ? { avatarUrl: body.data.avatarUrl.trim() } : auth.user.avatarUrl ? { avatarUrl: auth.user.avatarUrl } : {}),
  };

  const result = await provider.profiles.upsert(auth.user.uid, profile);
  return fromProviderResult(result, { successStatus: 201 });
}
