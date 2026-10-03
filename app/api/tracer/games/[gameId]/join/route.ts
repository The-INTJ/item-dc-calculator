import { JoinGameSchema } from '@/features/tracer/lib/schemas';
import { joinExistingGame } from '@/features/tracer/lib/server';

import { gameCommandRoute, type GameRouteContext } from '../../../_lib/gameRoute';

export const dynamic = 'force-dynamic';

/** Take the empty seat. Returns `{ side }`; joining your own game is a no-op. */
export async function POST(request: Request, context: GameRouteContext) {
  return gameCommandRoute(request, context, {
    schema: JoinGameSchema,
    run: ({ gameId, actor, body }) => joinExistingGame(gameId, actor, body.displayName),
  });
}
