import { ReleaseSeatSchema } from '@/features/tracer/lib/schemas';
import { reopenSeat } from '@/features/tracer/lib/server';

import { gameCommandRoute, type GameRouteContext } from '../../../../_lib/gameRoute';

export const dynamic = 'force-dynamic';

/** Reopen a stalled opponent's seat so they can rejoin. Returns `{ side }`. */
export async function POST(request: Request, context: GameRouteContext) {
  return gameCommandRoute(request, context, {
    schema: ReleaseSeatSchema,
    run: ({ gameId, actor, body }) => reopenSeat(gameId, actor, body.side),
  });
}
