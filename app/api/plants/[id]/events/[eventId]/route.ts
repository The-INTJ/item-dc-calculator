import { deleteEvent } from '@/plants/lib/server/plantsStore';

import { fromResult } from '../../../_lib/http';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string; eventId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id, eventId } = await params;
  const result = await deleteEvent(id, eventId);
  return fromResult(result);
}
