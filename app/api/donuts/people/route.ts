import { CreatePersonSchema } from '@/donuts/lib/schemas';
import { addPerson } from '@/donuts/lib/server/peopleStore';

import { fromResult, parseBody } from '../_lib/http';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await parseBody(request, CreatePersonSchema);
  if (!body.ok) {
    return body.response;
  }
  const result = await addPerson(body.data.name, body.data.active ?? true);
  return fromResult(result, { failureStatus: 400, successStatus: 201 });
}
