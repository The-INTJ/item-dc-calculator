import type { NextResponse } from 'next/server';
import { z, type ZodType } from 'zod';

import { parseBody } from '@/app/api/contest/_lib/http';
import { requireAuth } from '@/app/api/contest/_lib/requireAuth';
import { TracerError } from '@/features/tracer/lib/errors';
import { isGameId } from '@/features/tracer/lib/schemas';
import type { Actor } from '@/features/tracer/lib/types';

import { respond, tracerErrorResponse } from './respond';

export interface GameRouteContext {
  params: Promise<{ gameId: string }>;
}

/** For commands with nothing to say: the client sends `{}`. */
export const EmptyBodySchema = z.object({});

interface GameCommandOptions<S extends ZodType, T> {
  schema: S;
  run: (args: { gameId: string; actor: Actor; body: z.infer<S> }) => Promise<T>;
  successStatus?: number;
}

/**
 * The shared shape of every `/api/tracer/games/[gameId]/*` command: verify
 * the caller, check the id looks like a game id, validate the body, then run
 * the service call and map its outcome to a response.
 */
export async function gameCommandRoute<S extends ZodType, T>(
  request: Request,
  context: GameRouteContext,
  options: GameCommandOptions<S, T>,
): Promise<NextResponse> {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;
  const { gameId } = await context.params;
  if (!isGameId(gameId)) {
    return tracerErrorResponse(new TracerError('GAME_NOT_FOUND', 'That game does not exist.'));
  }
  const body = await parseBody(request, options.schema);
  if (!body.ok) return body.response;
  const actor: Actor = { uid: auth.user.uid };
  return respond(() => options.run({ gameId, actor, body: body.data }), options.successStatus);
}
