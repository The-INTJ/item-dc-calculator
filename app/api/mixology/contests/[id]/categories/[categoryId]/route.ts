import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/mixology/server/backend';
import { requireAdmin } from '../../../../_lib/requireAdmin';
import type { VoteCategory } from '@/mixology/types';

interface RouteParams {
  params: Promise<{ id: string; categoryId: string }>;
}

async function getContestByParam(contestParam: string) {
  const provider = await getBackendProvider();
  const contestsResult = await provider.contests.list();
  if (!contestsResult.success || !contestsResult.data) {
    return { provider, contest: null, error: contestsResult.error ?? 'Failed to fetch contests' };
  }

  const contest = contestsResult.data.find((item) => item.id === contestParam || item.slug === contestParam) ?? null;
  return { provider, contest, error: contest ? null : 'Contest not found' };
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const adminError = requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id, categoryId } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return NextResponse.json({ message: error }, { status: 404 });
  }

  const categories: VoteCategory[] = contest.categories ?? [];
  if (!categories.some((category) => category.id === categoryId)) {
    return NextResponse.json({ message: 'Category not found' }, { status: 404 });
  }

  const updateResult = await provider.contests.update(contest.id, {
    categories: categories.filter((category) => category.id !== categoryId),
  });

  if (!updateResult.success || !updateResult.data) {
    return NextResponse.json({ message: updateResult.error ?? 'Failed to update categories' }, { status: 500 });
  }

  return NextResponse.json({ categories: updateResult.data.categories ?? [] });
}
