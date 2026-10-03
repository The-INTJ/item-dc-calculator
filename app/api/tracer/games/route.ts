import { parseBody } from '@/app/api/contest/_lib/http';
import { requireAuth } from '@/app/api/contest/_lib/requireAuth';
import { CreateGameSchema } from '@/features/tracer/lib/schemas';
import { createNewGame } from '@/features/tracer/lib/server';

import { respond } from '../_lib/respond';

export const dynamic = 'force-dynamic';

/** Start a new game. Returns 201 `{ gameId }`. */
export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  const body = await parseBody(request, CreateGameSchema);
  if (!body.ok) return body.response;
  return respond(() => createNewGame({ uid: auth.user.uid }, body.data), 201);
}
