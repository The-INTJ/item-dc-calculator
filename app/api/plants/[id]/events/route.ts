import { AddEventSchema } from '@/plants/lib/schemas';
import { addEvent } from '@/plants/lib/server/plantsStore';

import { fromResult, parseBody } from '../../_lib/http';
import { requirePlantAccess } from '../../_lib/requirePlantAccess';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const accessError = await requirePlantAccess(request);
  if (accessError) {
    return accessError;
  }

  const { id } = await params;
  const body = await parseBody(request, AddEventSchema);
  if (!body.ok) {
    return body.response;
  }

  const result = await addEvent(id, body.data);
  return fromResult(result, { successStatus: 201 });
}
