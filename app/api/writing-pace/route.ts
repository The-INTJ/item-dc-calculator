import { revalidateTag } from 'next/cache';

import { countWords, paceFor, snapshotDate } from '@/features/writing-pace/lib/pace';

export const dynamic = 'force-dynamic';

const ONE_DAY_SECONDS = 86_400;
const CACHE_TAG = 'writing-pace';
/** The doc's first tab, the manuscript; later tabs hold notes and ideas. */
const MANUSCRIPT_TAB = 't.0';

/**
 * Words-per-day for the doc named by WRITING_DOC_ID (kept out of the repo,
 * which is public). The doc must be readable by anyone with the link.
 * Without a tab, the export runs every tab together.
 */
async function readPace(init: RequestInit) {
  const docId = process.env.WRITING_DOC_ID;
  if (!docId) {
    return Response.json({ error: 'WRITING_DOC_ID is not set' }, { status: 404 });
  }

  const snapshot = snapshotDate(new Date());
  const url = `https://docs.google.com/document/d/${encodeURIComponent(docId)}/export?format=txt&tab=${MANUSCRIPT_TAB}&snapshot=${snapshot}`;
  const response = await fetch(url, init);
  if (!response.ok) {
    return Response.json({ error: `Doc export failed (${response.status})` }, { status: 502 });
  }

  return Response.json(paceFor(countWords(await response.text()), snapshot));
}

/**
 * The cached count. The export URL carries the snapshot date, so the data
 * cache holds one fetch per day: the first request after 6am Eastern takes
 * that day's count, unless a refresh replaces it.
 */
export async function GET() {
  return readPace({ next: { revalidate: ONE_DAY_SECONDS, tags: [CACHE_TAG] } });
}

/** The refresh button: a live count now, and the cached one expired with it. */
export async function POST() {
  revalidateTag(CACHE_TAG, { expire: 0 });
  return readPace({ cache: 'no-store' });
}
