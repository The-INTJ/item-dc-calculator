import { NextResponse } from 'next/server';
import { getBackendProvider } from '@/mixology/server/backend';
import type { Entry, Judge, JudgeRole, ScoreBreakdown, Contest } from '@/mixology/types';
import { getEffectiveConfig, isValidAttributeId, createEmptyBreakdown } from '@/mixology/types';

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
    const entryExists = entries.some((entry) => entry.id === entryId);
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

    // Get config for this contest (falls back to Mixology default)
    const config = getEffectiveConfig(contest);
    const naSectionsProvided = body.naSections !== undefined;

    if (naSectionsProvided && !Array.isArray(body.naSections)) {
      return NextResponse.json({ message: 'naSections must be an array of attribute IDs.' }, { status: 400 });
    }

    const normalizedNaSections = Array.isArray(body.naSections)
      ? body.naSections.map((section) => section.trim()).filter(Boolean)
      : [];

    for (const section of normalizedNaSections) {
      if (!isValidAttributeId(section, config)) {
        return NextResponse.json({ message: `Invalid N/A section: ${section}.` }, { status: 400 });
      }
    }

    const naSectionSet = new Set(normalizedNaSections);

    let breakdownUpdates: Partial<ScoreBreakdown> | null = null;

    if (body.breakdown && Object.keys(body.breakdown).length > 0) {
      breakdownUpdates = body.breakdown;
    } else if (body.categoryId) {
      // Validate categoryId against contest config
      if (!isValidAttributeId(body.categoryId, config)) {
        return NextResponse.json({ message: 'Invalid categoryId for scoring.' }, { status: 400 });
      }
      if (naSectionSet.has(body.categoryId)) {
        return NextResponse.json({ message: 'Cannot score a section marked N/A.' }, { status: 400 });
      }
      const numericValue = Number(body.value);
      if (!Number.isFinite(numericValue)) {
        return NextResponse.json({ message: 'Score value must be numeric.' }, { status: 400 });
      }
      breakdownUpdates = { [body.categoryId]: numericValue };
    }

    if (!breakdownUpdates && !naSectionsProvided) {
      return NextResponse.json({ message: 'Score breakdown or categoryId + value is required.' }, { status: 400 });
    }

    if (breakdownUpdates) {
      for (const [key, value] of Object.entries(breakdownUpdates)) {
        if (!isValidAttributeId(key, config)) {
          return NextResponse.json({ message: `Invalid breakdown key: ${key}.` }, { status: 400 });
        }

        if (naSectionSet.has(key)) {
          if (typeof value === 'number' && Number.isFinite(value)) {
            return NextResponse.json({ message: `Cannot score N/A section: ${key}.` }, { status: 400 });
          }
          if (value !== null && value !== undefined) {
            return NextResponse.json({ message: `Invalid value for N/A section: ${key}.` }, { status: 400 });
          }
          continue;
        }

        if (value === null) {
          return NextResponse.json({ message: `Section ${key} must have a numeric score.` }, { status: 400 });
        }

        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return NextResponse.json({ message: `Invalid score value for ${key}.` }, { status: 400 });
        }
      }
    }

    const normalizedBreakdownUpdates = breakdownUpdates ? { ...breakdownUpdates } : (naSectionsProvided ? {} : null);

    if (normalizedBreakdownUpdates && naSectionsProvided) {
      for (const section of normalizedNaSections) {
        normalizedBreakdownUpdates[section] = null;
      }
    }

    const existingScores = await provider.scores.listByEntry(contest.id, entryId);
    if (!existingScores.success || !existingScores.data) {
      return NextResponse.json({ message: existingScores.error ?? 'Failed to load scores' }, { status: 500 });
    }

    const existing = existingScores.data.find((score) => score.judgeId === judgeId);

    if (existing) {
      const updateResult = await provider.scores.update(contest.id, existing.id, {
        breakdown: normalizedBreakdownUpdates ?? undefined,
        notes: body.notes,
        naSections: naSectionsProvided ? normalizedNaSections : undefined,
      });
      if (!updateResult.success || !updateResult.data) {
        return NextResponse.json({ message: updateResult.error ?? 'Failed to update score' }, { status: 500 });
      }
      return NextResponse.json(updateResult.data);
    }

    // Create breakdown based on contest config, merging in updates
    const emptyBreakdown = createEmptyBreakdown(config);
    const breakdown: ScoreBreakdown = { ...emptyBreakdown };
    if (naSectionsProvided) {
      for (const section of normalizedNaSections) {
        breakdown[section] = null;
      }
    }
    if (normalizedBreakdownUpdates) {
      for (const [key, value] of Object.entries(normalizedBreakdownUpdates)) {
        if (typeof value === 'number' || value === null) {
          breakdown[key] = value;
        }
      }
    }
    const submitResult = await provider.scores.submit(contest.id, {
      entryId,
      judgeId,
      breakdown,
      notes: body.notes,
      naSections: normalizedNaSections.length > 0 ? normalizedNaSections : undefined,
    });

    if (!submitResult.success || !submitResult.data) {
      return NextResponse.json({ message: submitResult.error ?? 'Failed to submit score' }, { status: 500 });
    }

    return NextResponse.json(submitResult.data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
}
