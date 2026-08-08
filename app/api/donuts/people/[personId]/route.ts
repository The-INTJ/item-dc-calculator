import { UpdatePersonSchema } from '@/donuts/lib/schemas';
import { removePerson, updatePerson } from '@/donuts/lib/server/peopleStore';

import { fromResult, parseBody } from '../../_lib/http';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ personId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { personId } = await params;
  const body = await parseBody(request, UpdatePersonSchema);
  if (!body.ok) {
    return body.response;
  }
  return fromResult(await updatePerson(personId, body.data), { failureStatus: 400 });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { personId } = await params;
  return fromResult(await removePerson(personId), { failureStatus: 400 });
}
