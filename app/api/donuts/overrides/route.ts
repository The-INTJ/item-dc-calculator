import { CreateOverrideSchema } from '@/donuts/lib/schemas';
import { addOverride } from '@/donuts/lib/server/assignmentStore';

import { fromResult, parseBody } from '../_lib/http';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await parseBody(request, CreateOverrideSchema);
  if (!body.ok) {
    return body.response;
  }
  return fromResult(await addOverride(body.data), {
    failureStatus: 400,
    successStatus: 201,
  });
}
