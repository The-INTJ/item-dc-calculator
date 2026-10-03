import { SubmitTurnSchema } from '@/features/tracer/lib/schemas';
import { playTurn } from '@/features/tracer/lib/server';

import { gameCommandRoute, type GameRouteContext } from '../../../_lib/gameRoute';

export const dynamic = 'force-dynamic';

/**
 * Submit a whole turn. Returns `{ ply, status, replayed }`; a retry carrying
 * the last turn's `clientTurnId` is acknowledged without writing anything.
 */
export async function POST(request: Request, context: GameRouteContext) {
  return gameCommandRoute(request, context, {
    schema: SubmitTurnSchema,
    run: ({ gameId, actor, body }) => playTurn(gameId, actor, body),
  });
}
