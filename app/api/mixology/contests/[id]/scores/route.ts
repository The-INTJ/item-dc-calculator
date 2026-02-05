import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/src/features/mixology/lib/helpers';
import type { Entry, Judge, JudgeRole, ScoreBreakdown, Contest } from '@/src/features/mixology/lib/globals';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ScoreSubmitBody {
  entryId?: string;
  drinkId?: string; // Deprecated, use entryId
  judgeId: string;
  judgeName?: string;
  judgeRole?: JudgeRole;
  categoryId?: string;
  value?: number;
  breakdown?: Partial<ScoreBreakdown>;
  naSections?: string[];
  notes?: string;
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

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return NextResponse.json({ message: error }, { status: 404 });
  }

  const url = new URL(request.url);
  const entryId = url.searchParams.get('entryId') ?? url.searchParams.get('drinkId');
  const judgeId = url.searchParams.get('judgeId');

  if (entryId) {
    const result = await provider.scores.listByEntry(contest.id, entryId);
    if (!result.success || !result.data) {
      return NextResponse.json({ message: result.error ?? 'Scores not found' }, { status: 404 });
    }

    const filtered = judgeId ? result.data.filter((score) => score.judgeId === judgeId) : result.data;
    return NextResponse.json({ scores: filtered });
  }

  if (judgeId) {
    const result = await provider.scores.listByJudge(contest.id, judgeId);
    if (!result.success || !result.data) {
      return NextResponse.json({ message: result.error ?? 'Scores not found' }, { status: 404 });
    }

    return NextResponse.json({ scores: result.data });
  }

  return NextResponse.json({ scores: contest.scores ?? [] });
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return NextResponse.json({ message: error }, { status: 404 });
  }

  try {
    const body = (await request.json()) as ScoreSubmitBody;
    const entryId = (body.entryId ?? body.drinkId)?.trim();
    const judgeId = body.judgeId?.trim();

    if (!entryId || !judgeId) {
      return NextResponse.json({ message: 'entryId and judgeId are required.' }, { status: 400 });
    }

    const entries: Entry[] = contest.entries;
    const entryExists = entries?.some((entry) => entry.id === entryId);
    if (!entryExists) {
      return NextResponse.json({ message: 'Entry not found.' }, { status: 404 });
    }

    const judges: Judge[] = contest.judges ?? [];
    if (!judges.some((judge) => judge.id === judgeId)) {
      await provider.judges.create(contest.id, {
        id: judgeId,
        displayName: body.judgeName ?? 'Guest Judge',
        role: body.judgeRole ?? 'judge',
      });
    }

    const naSectionsProvided = body.naSections !== undefined;

    if (naSectionsProvided && !Array.isArray(body.naSections)) {
      return NextResponse.json({ message: 'naSections must be an array of attribute IDs.' }, { status: 400 });
    }

    const sanitizeBreakdown = (
      updates: Partial<ScoreBreakdown>
    ): Partial<ScoreBreakdown> =>
      Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      ) as Partial<ScoreBreakdown>;

    let breakdownUpdates: Partial<ScoreBreakdown> | null = null;

    if (body.breakdown && Object.keys(body.breakdown).length > 0) {
      breakdownUpdates = body.breakdown;
    } else if (body.categoryId) {
      const numericValue = Number(body.value);
      if (!Number.isFinite(numericValue)) {
        return NextResponse.json({ message: 'Score value must be numeric.' }, { status: 400 });
      }
      breakdownUpdates = { [body.categoryId]: numericValue };
    }

    const normalizedBreakdown = breakdownUpdates ? sanitizeBreakdown(breakdownUpdates) : null;

    if (!normalizedBreakdown && !naSectionsProvided) {
      return NextResponse.json({ message: 'Score breakdown or categoryId + value is required.' }, { status: 400 });
    }

    const existingScores = await provider.scores.listByEntry(contest.id, entryId);
    if (!existingScores.success || !existingScores.data) {
      return NextResponse.json({ message: existingScores.error ?? 'Failed to load scores' }, { status: 500 });
    }

    const existing = existingScores.data.find((score) => score.judgeId === judgeId);

    if (existing) {
      const updateResult = await provider.scores.update(contest.id, existing.id, {
        breakdown: normalizedBreakdown ?? undefined,
        notes: body.notes,
        naSections: naSectionsProvided ? body.naSections : undefined,
      });
      if (!updateResult.success || !updateResult.data) {
        const message = updateResult.error ?? 'Failed to update score';
        const status = message.startsWith('Validation:') ? 400 : 500;
        return NextResponse.json({ message }, { status });
      }
      return NextResponse.json(updateResult.data);
    }

    const submitResult = await provider.scores.submit(contest.id, {
      entryId,
      judgeId,
      breakdown: (normalizedBreakdown ?? {}) as ScoreBreakdown,
      notes: body.notes,
      naSections: naSectionsProvided ? body.naSections : undefined,
    });

    if (!submitResult.success || !submitResult.data) {
      const message = submitResult.error ?? 'Failed to submit score';
      const status = message.startsWith('Validation:') ? 400 : 500;
      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(submitResult.data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
