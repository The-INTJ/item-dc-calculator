import { resignFromGame } from '@/features/tracer/lib/server';

import { EmptyBodySchema, gameCommandRoute, type GameRouteContext } from '../../../_lib/gameRoute';

export const dynamic = 'force-dynamic';

/** Resign. Returns `{ result }`. */
export async function POST(request: Request, context: GameRouteContext) {
  return gameCommandRoute(request, context, {
    schema: EmptyBodySchema,
    run: ({ gameId, actor }) => resignFromGame(gameId, actor),
  });
}
