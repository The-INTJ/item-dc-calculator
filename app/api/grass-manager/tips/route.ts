import { TipCardSchema } from '@/features/grass-manager/lib/schemas';
import { createTipCard, listTipCards } from '@/features/grass-manager/lib/server/tipsStore';

import { requireTipEditor } from '../_lib/requireTipEditor';
import { fromResult, jsonSuccess, parseBody } from '../../plants/_lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await listTipCards();
  if (!result.success) return jsonSuccess({ cards: [] });
  return jsonSuccess({ cards: result.data });
}

export async function POST(request: Request) {
  const accessError = await requireTipEditor(request);
  if (accessError) return accessError;
  const body = await parseBody(request, TipCardSchema);
  if (!body.ok) return body.response;
  const result = await createTipCard(body.data);
  return fromResult(result, { failureStatus: 500, successStatus: 201 });
}
