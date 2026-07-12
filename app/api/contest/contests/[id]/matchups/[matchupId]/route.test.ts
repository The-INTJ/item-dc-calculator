import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATCH } from './route';
import type { Matchup } from '@/contest/contexts/contest/contestTypes';

const getContestByParamMock = vi.fn();
const requireAdminMock = vi.fn();

vi.mock('@/contest/lib/backend/serverProvider', () => ({
  getContestByParam: (contestId: string) => getContestByParamMock(contestId),
}));

vi.mock('../../../../_lib/requireAdmin', () => ({
  requireAdmin: (request: Request) => requireAdminMock(request),
}));

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/contest/contests/contest-1/matchups/m-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const routeParams = { params: Promise.resolve({ id: 'contest-1', matchupId: 'm-1' }) };

function makeContext(existing: Partial<Matchup>) {
  const getById = vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'm-1',
      contestId: 'contest-1',
      roundId: 'round-1',
      slotIndex: 0,
      phase: 'shake',
      entries: [],
      ...existing,
    },
  });
  const update = vi.fn().mockResolvedValue({ success: true, data: { id: 'm-1' } });
  getContestByParamMock.mockResolvedValue({
    error: null,
    contest: { id: 'contest-1', contestants: [], voters: [] },
    provider: { matchups: { getById, update } },
  });
  return { getById, update };
}

describe('/api/contest/contests/[id]/matchups/[matchupId] PATCH', () => {
  beforeEach(() => {
    getContestByParamMock.mockReset();
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue(null);
  });

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockResolvedValue(
      Response.json({ message: 'Admin access required' }, { status: 403 }),
    );
    const response = await PATCH(makeRequest({ phase: 'shake' }), routeParams);
    expect(response.status).toBe(403);
  });

  it('auto-resolves the winner when scoring a matchup without one', async () => {
    const { update } = makeContext({
      entries: [
        { id: 'e-1', contestantId: 'c-1', matchupId: 'm-1', name: 'A', sumScore: 40, voteCount: 5 },
        { id: 'e-2', contestantId: 'c-2', matchupId: 'm-1', name: 'B', sumScore: 30, voteCount: 5 },
      ],
    });

    const response = await PATCH(makeRequest({ phase: 'scored' }), routeParams);
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith('contest-1', 'm-1', {
      phase: 'scored',
      winnerEntryId: 'e-1',
    });
  });

  it('honors an explicitly provided winner without re-resolving', async () => {
    const { getById, update } = makeContext({});

    const response = await PATCH(
      makeRequest({ phase: 'scored', winnerEntryId: 'e-2' }),
      routeParams,
    );
    expect(response.status).toBe(200);
    expect(getById).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith('contest-1', 'm-1', {
      phase: 'scored',
      winnerEntryId: 'e-2',
    });
  });

  it('keeps an already-recorded winner instead of re-resolving', async () => {
    const { update } = makeContext({
      winnerEntryId: 'e-2',
      entries: [
        { id: 'e-1', contestantId: 'c-1', matchupId: 'm-1', name: 'A', sumScore: 40, voteCount: 5 },
        { id: 'e-2', contestantId: 'c-2', matchupId: 'm-1', name: 'B', sumScore: 30, voteCount: 5 },
      ],
    });

    const response = await PATCH(makeRequest({ phase: 'scored' }), routeParams);
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith('contest-1', 'm-1', { phase: 'scored' });
  });

  it('proceeds winnerless when scores are tied', async () => {
    const { update } = makeContext({
      entries: [
        { id: 'e-1', contestantId: 'c-1', matchupId: 'm-1', name: 'A', sumScore: 35, voteCount: 5 },
        { id: 'e-2', contestantId: 'c-2', matchupId: 'm-1', name: 'B', sumScore: 21, voteCount: 3 },
      ],
    });

    const response = await PATCH(makeRequest({ phase: 'scored' }), routeParams);
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith('contest-1', 'm-1', { phase: 'scored' });
  });

  it('does not fetch the matchup for non-scoring updates', async () => {
    const { getById, update } = makeContext({});

    const response = await PATCH(makeRequest({ phase: 'shake' }), routeParams);
    expect(response.status).toBe(200);
    expect(getById).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith('contest-1', 'm-1', { phase: 'shake' });
  });
});
