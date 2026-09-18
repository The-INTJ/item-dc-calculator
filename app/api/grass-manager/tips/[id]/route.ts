import { TipCardPatchSchema } from '@/features/grass-manager/lib/schemas';
import { updateTipCard } from '@/features/grass-manager/lib/server/tipsStore';

import { requireTipEditor } from '../../_lib/requireTipEditor';
import { fromResult, parseBody } from '../../../plants/_lib/http';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const accessError = await requireTipEditor(request);
  if (accessError) return accessError;
  const { id } = await params;
  const body = await parseBody(request, TipCardPatchSchema);
  if (!body.ok) return body.response;
  const result = await updateTipCard(id, body.data);
  return fromResult(result, { failureStatus: 500 });
}
