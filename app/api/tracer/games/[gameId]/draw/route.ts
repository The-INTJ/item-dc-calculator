import { DrawActionSchema } from '@/features/tracer/lib/schemas';
import { answerDraw } from '@/features/tracer/lib/server';

import { gameCommandRoute, type GameRouteContext } from '../../../_lib/gameRoute';

export const dynamic = 'force-dynamic';

/** Offer, accept, decline or withdraw a draw. Returns `{ drawOffer, result }`. */
export async function POST(request: Request, context: GameRouteContext) {
  return gameCommandRoute(request, context, {
    schema: DrawActionSchema,
    run: ({ gameId, actor, body }) => answerDraw(gameId, actor, body.action),
  });
}
