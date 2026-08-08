import { removeOverride } from '@/donuts/lib/server/assignmentStore';

import { fromResult } from '../../_lib/http';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ overrideId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { overrideId } = await params;
  return fromResult(await removeOverride(overrideId), { failureStatus: 400 });
}
