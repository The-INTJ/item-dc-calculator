import { CreatePlantSchema } from '@/plants/lib/schemas';
import { createPlant, listPlants } from '@/plants/lib/server/plantsStore';

import { fromResult, jsonError, jsonSuccess, parseBody } from './_lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await listPlants();
  if (!result.success) {
    return jsonError(result.error ?? 'Failed to load plants', 500);
  }
  return jsonSuccess({ plants: result.data ?? [] });
}

export async function POST(request: Request) {
  const body = await parseBody(request, CreatePlantSchema);
  if (!body.ok) {
    return body.response;
  }

  const result = await createPlant(body.data.name);
  return fromResult(result, { failureStatus: 400, successStatus: 201 });
}
