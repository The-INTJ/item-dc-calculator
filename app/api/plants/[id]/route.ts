import { UpdatePlantSchema } from '@/plants/lib/schemas';
import { deletePlant, getPlant, updatePlant } from '@/plants/lib/server/plantsStore';

import { fromResult, parseBody } from '../_lib/http';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const result = await getPlant(id);
  return fromResult(result);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await parseBody(request, UpdatePlantSchema);
  if (!body.ok) {
    return body.response;
  }

  const result = await updatePlant(id, body.data.name);
  return fromResult(result, { failureStatus: 400 });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const result = await deletePlant(id);
  return fromResult(result, { successStatus: 204 });
}
