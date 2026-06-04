import { UpdateEventWeightsSchema } from '@/plants/lib/schemas';
import { deleteEvent, updateEventWeights } from '@/plants/lib/server/plantsStore';

import { fromResult, parseBody } from '../../../_lib/http';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string; eventId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, eventId } = await params;
  const body = await parseBody(request, UpdateEventWeightsSchema);
  if (!body.ok) {
    return body.response;
  }

  const result = await updateEventWeights(id, eventId, body.data);
  return fromResult(result, { failureStatus: 400 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id, eventId } = await params;
  const result = await deleteEvent(id, eventId);
  return fromResult(result);
}
