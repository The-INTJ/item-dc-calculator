import { countWords, paceFor, snapshotDate } from '@/features/writing-pace/lib/pace';

export const dynamic = 'force-dynamic';

const ONE_DAY_SECONDS = 86_400;

/**
 * Today's words-per-day for the doc named by WRITING_DOC_ID (kept out of the
 * repo, which is public). The doc must be readable by anyone with the link.
 *
 * The export URL carries the snapshot date, so the data cache holds one fetch
 * per day: the first request after 6am Eastern takes that day's count.
 */
export async function GET() {
  const docId = process.env.WRITING_DOC_ID;
  if (!docId) {
    return Response.json({ error: 'WRITING_DOC_ID is not set' }, { status: 404 });
  }

  const snapshot = snapshotDate(new Date());
  const url = `https://docs.google.com/document/d/${encodeURIComponent(docId)}/export?format=txt&snapshot=${snapshot}`;
  const response = await fetch(url, { next: { revalidate: ONE_DAY_SECONDS } });
  if (!response.ok) {
    return Response.json({ error: `Doc export failed (${response.status})` }, { status: 502 });
  }

  return Response.json(paceFor(countWords(await response.text()), snapshot));
}
