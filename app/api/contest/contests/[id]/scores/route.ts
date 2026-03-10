import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/contest/lib/helpers/backendProvider';
import type { Entry, ScoreBreakdown, UserRole } from '@/src/features/contest/contexts/contest/contestTypes';
import { getAuthenticatedUserFromRequest } from '@/contest/lib/api/serverAuth';
import { requireAdmin } from '../../../_lib/requireAdmin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ScoreSubmitBody {
  entryId?: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  categoryId?: string;
  value?: number;
  breakdown?: Partial<ScoreBreakdown>;
  round?: string;
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
  const entryId = url.searchParams.get('entryId');
  const userId = url.searchParams.get('userId');

  if (entryId) {
    const adminError = await requireAdmin(request);
    if (adminError) {
      return adminError;
    }

    const result = await provider.scores.listByEntry(contest.id, entryId);
    if (!result.success || !result.data) {
      return NextResponse.json({ message: result.error ?? 'Scores not found' }, { status: 404 });
    }

    return NextResponse.json({ scores: result.data });
  }

  if (userId) {
    const currentUser = await getAuthenticatedUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (currentUser.uid !== userId && currentUser.profile.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const result = await provider.scores.listByUser(contest.id, userId);
    if (!result.success || !result.data) {
      return NextResponse.json({ message: result.error ?? 'Scores not found' }, { status: 404 });
    }

    return NextResponse.json({ scores: result.data });
  }

  return NextResponse.json({ scores: [] });
}

export async function POST(request: Request, { params }: RouteParams) {
  const currentUser = await getAuthenticatedUserFromRequest(request);
  if (!currentUser) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const { provider, contest, error } = await getContestByParam(id);
  if (!contest) {
    return NextResponse.json({ message: error }, { status: 404 });
  }

  try {
    const body = (await request.json()) as ScoreSubmitBody;
    const entryId = body.entryId?.trim();

    if (!entryId) {
      return NextResponse.json({ message: 'entryId is required.' }, { status: 400 });
    }

    if (body.userId && body.userId.trim() !== currentUser.uid) {
      return NextResponse.json({ message: 'Cannot submit a score for another user.' }, { status: 403 });
    }

    const entries: Entry[] = contest.entries;
    const entry = entries.find((candidate) => candidate.id === entryId);
    if (!entry) {
      return NextResponse.json({ message: 'Entry not found.' }, { status: 404 });
    }

    const voters = contest.voters ?? [];
    if (!voters.some((voter) => voter.id === currentUser.uid)) {
      await provider.voters.create(contest.id, {
        id: currentUser.uid,
        displayName: currentUser.profile.displayName,
        role: currentUser.profile.role,
      });
    }

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

    if (!breakdownUpdates) {
      return NextResponse.json({ message: 'Score breakdown or categoryId + value is required.' }, { status: 400 });
    }

    const round = body.round ?? entry.round ?? '';
    const submitResult = await provider.scores.submit(contest.id, {
      entryId,
      userId: currentUser.uid,
      round,
      breakdown: breakdownUpdates as ScoreBreakdown,
      ...(body.notes ? { notes: body.notes } : {}),
    });

    if (!submitResult.success || !submitResult.data) {
      const message = submitResult.error ?? 'Failed to submit score';
      const status = message.startsWith('Validation:') ? 400 : 500;
      return NextResponse.json({ message }, { status });
    }

    return NextResponse.json(submitResult.data);
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}

