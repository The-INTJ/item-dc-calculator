import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/mixology/server/backend';
import { requireAdmin } from '../../../_lib/requireAdmin';
import type { VoteCategory } from '@/mixology/types';

interface RouteParams {
  params: Promise<{ id: string }>;
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

export async function GET(_: Request, { params }: RouteParams) {
  const { id } = await params;
  const { contest, error } = await getContestByParam(id);

  if (!contest) {
    return NextResponse.json({ message: error }, { status: 404 });
  }

  return NextResponse.json({ categories: contest.categories ?? [] });
}

export async function POST(request: Request, { params }: RouteParams) {
  const adminError = await requireAdmin(request);
  if (adminError) {
    return adminError;
  }

  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return NextResponse.json({ message: error }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Partial<VoteCategory>;
    const categoryId = body.id?.trim();
    const label = body.label?.trim();

    if (!categoryId || !label) {
      return NextResponse.json({ message: 'Category id and label are required.' }, { status: 400 });
    }

    const categories: VoteCategory[] = contest.categories ?? [];
    if (categories.some((category) => category.id === categoryId)) {
      return NextResponse.json({ message: 'Category already exists.' }, { status: 409 });
    }

    const nextCategory: VoteCategory = {
      id: categoryId,
      label,
      description: body.description,
      sortOrder: body.sortOrder ?? categories.length,
    };

    const updateResult = await provider.contests.update(contest.id, {
      categories: [...categories, nextCategory],
    });

    if (!updateResult.success || !updateResult.data) {
      return NextResponse.json({ message: updateResult.error ?? 'Failed to update categories' }, { status: 500 });
    }

    return NextResponse.json({ categories: updateResult.data.categories ?? [] }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
