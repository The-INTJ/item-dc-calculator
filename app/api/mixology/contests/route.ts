import { NextResponse } from 'next/server';
import { getContestBySlug, getDefaultContest, listContests } from '@/src/mixology/data/store';

export function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (slug) {
    const contest = getContestBySlug(slug);
    if (!contest) {
      return NextResponse.json({ message: 'Contest not found' }, { status: 404 });
    }

    return NextResponse.json(contest);
  }

  const defaultContest = getDefaultContest();
  return NextResponse.json({
    contests: listContests(),
    currentContest: defaultContest ?? null,
  });
}
