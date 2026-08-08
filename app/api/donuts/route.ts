import { loadBoard } from '@/donuts/lib/server/boardAccess';

import { fromResult } from './_lib/http';

export const dynamic = 'force-dynamic';

/**
 * The whole board in one read. Schedule resolution happens on the client so
 * "this Sunday" follows the viewer's own calendar rather than the server's.
 */
export async function GET() {
  return fromResult(await loadBoard());
}
