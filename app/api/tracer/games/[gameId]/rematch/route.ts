import { startRematch } from '@/features/tracer/lib/server';

import { EmptyBodySchema, gameCommandRoute, type GameRouteContext } from '../../../_lib/gameRoute';

export const dynamic = 'force-dynamic';

/** Start (or find) the rematch with colours swapped. Returns `{ gameId }`. */
export async function POST(request: Request, context: GameRouteContext) {
  return gameCommandRoute(request, context, {
    schema: EmptyBodySchema,
    run: ({ gameId, actor }) => startRematch(gameId, actor),
  });
}
