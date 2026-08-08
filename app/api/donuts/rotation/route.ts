import { SetRotationSchema } from '@/donuts/lib/schemas';
import { setRotation } from '@/donuts/lib/server/peopleStore';

import { fromResult, parseBody } from '../_lib/http';

export const dynamic = 'force-dynamic';

/** Replace the 1st-through-5th-Sunday base rotation. */
export async function PUT(request: Request) {
  const body = await parseBody(request, SetRotationSchema);
  if (!body.ok) {
    return body.response;
  }
  return fromResult(await setRotation(body.data.rotation), { failureStatus: 400 });
}
