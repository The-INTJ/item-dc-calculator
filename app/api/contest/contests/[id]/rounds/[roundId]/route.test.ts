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
  return new Request('http://localhost/api/contest/contests/contest-1/rounds/round-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function routeParams(roundId = 'round-1') {
  return { params: Promise.resolve({ id: 'contest-1', roundId }) };
}

function matchup(overrides: Partial<Matchup>): Matchup {
  return {
    id: 'm-1',
    contestId: 'contest-1',
    roundId: 'round-1',
    slotIndex: 0,
    phase: 'shake',
    entries: [],
    ...overrides,
  } as Matchup;
}

function makeContext(matchups: Matchup[]) {
  const listByRound = vi.fn().mockResolvedValue({ success: true, data: matchups });
  const update = vi.fn().mockResolvedValue({ success: true, data: {} });
  const contestsUpdate = vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'contest-1', rounds: [{ id: 'round-1', name: 'Round 1' }] },
  });
  getContestByParamMock.mockResolvedValue({
    error: null,
    contest: {
      id: 'contest-1',
      name: 'Test',
      slug: 'test',
      rounds: [{ id: 'round-1', name: 'Round 1' }],
      contestants: [],
      voters: [],
    },
    provider: {
      contests: { update: contestsUpdate },
      matchups: { listByRound, update },
    },
  });
  return { listByRound, update, contestsUpdate };
}

describe('/api/contest/contests/[id]/rounds/[roundId] route', () => {
  beforeEach(() => {
    getContestByParamMock.mockReset();
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue(null);
  });

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockResolvedValue(
      Response.json({ message: 'Admin access required' }, { status: 403 }),
    );
    const response = await PATCH(makeRequest({ adminOverride: 'closed' }), routeParams());
    expect(response.status).toBe(403);
  });

  it('returns 404 for an unknown round', async () => {
    makeContext([]);
    const response = await PATCH(makeRequest({ name: 'X' }), routeParams('round-ghost'));
    expect(response.status).toBe(404);
  });

  it('updates the round without touching matchups for name-only changes', async () => {
    const { contestsUpdate, listByRound, update } = makeContext([matchup({ phase: 'shake' })]);

    const response = await PATCH(makeRequest({ name: 'Semis' }), routeParams());
    expect(response.status).toBe(200);
    expect(contestsUpdate).toHaveBeenCalledWith('contest-1', {
      rounds: [{ id: 'round-1', name: 'Semis' }],
    });
    expect(listByRound).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('does not finalize matchups when forcing a round open', async () => {
    const { update } = makeContext([matchup({ phase: 'set' })]);
    const response = await PATCH(makeRequest({ adminOverride: 'active' }), routeParams());
    expect(response.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });

  it('force-close finalizes open matchups with resolved winners', async () => {
    const { update } = makeContext([
      matchup({
        id: 'm-open',
        phase: 'shake',
        entries: [
          { id: 'e-1', contestantId: 'c-1', matchupId: 'm-open', name: 'A', sumScore: 40, voteCount: 5 },
          { id: 'e-2', contestantId: 'c-2', matchupId: 'm-open', name: 'B', sumScore: 30, voteCount: 5 },
        ],
      }),
      matchup({ id: 'm-done', phase: 'scored', winnerEntryId: 'e-9' }),
    ]);

    const response = await PATCH(makeRequest({ adminOverride: 'closed' }), routeParams());
    expect(response.status).toBe(200);
    // Only the open matchup is finalized; the scored one is untouched.
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith('contest-1', 'm-open', {
      phase: 'scored',
      winnerEntryId: 'e-1',
    });
  });

  it('force-close records a null winner for ties and unopened matchups', async () => {
    const { update } = makeContext([
      matchup({
        id: 'm-tied',
        phase: 'shake',
        entries: [
          { id: 'e-1', contestantId: 'c-1', matchupId: 'm-tied', name: 'A', sumScore: 35, voteCount: 5 },
          { id: 'e-2', contestantId: 'c-2', matchupId: 'm-tied', name: 'B', sumScore: 21, voteCount: 3 },
        ],
      }),
      matchup({
        id: 'm-unopened',
        slotIndex: 1,
        phase: 'set',
        entries: [
          { id: 'e-3', contestantId: 'c-3', matchupId: 'm-unopened', name: 'C' },
          { id: 'e-4', contestantId: 'c-4', matchupId: 'm-unopened', name: 'D' },
        ],
      }),
    ]);

    const response = await PATCH(makeRequest({ adminOverride: 'closed' }), routeParams());
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith('contest-1', 'm-tied', {
      phase: 'scored',
      winnerEntryId: null,
    });
    expect(update).toHaveBeenCalledWith('contest-1', 'm-unopened', {
      phase: 'scored',
      winnerEntryId: null,
    });
  });

  it('force-close preserves an existing winner on a still-open matchup', async () => {
    const { update } = makeContext([
      matchup({
        id: 'm-preset',
        phase: 'shake',
        winnerEntryId: 'e-2',
        entries: [
          { id: 'e-1', contestantId: 'c-1', matchupId: 'm-preset', name: 'A', sumScore: 40, voteCount: 5 },
          { id: 'e-2', contestantId: 'c-2', matchupId: 'm-preset', name: 'B', sumScore: 30, voteCount: 5 },
        ],
      }),
    ]);

    const response = await PATCH(makeRequest({ adminOverride: 'closed' }), routeParams());
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith('contest-1', 'm-preset', {
      phase: 'scored',
      winnerEntryId: 'e-2',
    });
  });
});
