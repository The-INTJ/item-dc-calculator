import { AssignmentSchema } from '@/donuts/lib/schemas';
import { applyAssignment } from '@/donuts/lib/server/assignmentStore';

import { fromResult, parseBody } from '../_lib/http';

export const dynamic = 'force-dynamic';

/** Backs both main-page buttons: "I cannot do it" and "I can do it". */
export async function POST(request: Request) {
  const body = await parseBody(request, AssignmentSchema);
  if (!body.ok) {
    return body.response;
  }
  return fromResult(await applyAssignment(body.data), { failureStatus: 400 });
}
