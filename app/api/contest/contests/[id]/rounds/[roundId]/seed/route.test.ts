import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import type { Matchup } from '@/contest/contexts/contest/contestTypes';

const getContestByParamMock = vi.fn();
const requireAdminMock = vi.fn();

vi.mock('@/contest/lib/backend/serverProvider', () => ({
  getContestByParam: (contestId: string) => getContestByParamMock(contestId),
}));

vi.mock('../../../../../_lib/requireAdmin', () => ({
  requireAdmin: (request: Request) => requireAdminMock(request),
}));

function makeRequest(body: unknown = {}): Request {
  return new Request('http://localhost/api/contest/contests/contest-1/rounds/round-1/seed', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function routeParams(roundId = 'round-1') {
  return { params: Promise.resolve({ id: 'contest-1', roundId }) };
}

interface ProviderOverrides {
  listByRound?: ReturnType<typeof vi.fn>;
  batchCreate?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  delete?: ReturnType<typeof vi.fn>;
}

function makeProvider(overrides: ProviderOverrides = {}) {
  const matchups = {
    listByRound: overrides.listByRound ?? vi.fn().mockResolvedValue({ success: true, data: [] }),
    delete: overrides.delete ?? vi.fn().mockResolvedValue({ success: true }),
    batchCreate:
      overrides.batchCreate ??
      vi.fn().mockImplementation((_contestId: string, inputs: Array<Record<string, unknown>>) => {
        const created = inputs.map((input, i) => ({
          id: `created-${i}`,
          contestId: 'contest-1',
          roundId: input.roundId,
          slotIndex: input.slotIndex,
          phase: input.phase,
          entries: ((input.contestantIds as string[]) ?? []).map((contestantId, j) => ({
            id: `created-${i}-entry-${j}`,
            contestantId,
            matchupId: `created-${i}`,
            name: '',
            sumScore: 0,
            voteCount: 0,
          })),
        }));
        return Promise.resolve({ success: true, data: created });
      }),
    update: overrides.update ?? vi.fn().mockResolvedValue({ success: true, data: { winnerEntryId: 'x' } }),
  };
  return { matchups };
}

function contestWith(rounds: Array<{ id: string }>, contestantIds: string[]) {
  return {
    id: 'contest-1',
    name: 'Test',
    slug: 'test',
    rounds: rounds.map((r, i) => ({ id: r.id, name: `Round ${i + 1}` })),
    contestants: contestantIds.map((id) => ({ id, displayName: id })),
    voters: [],
  };
}

function prevMatchup(overrides: Partial<Matchup>): Matchup {
  return {
    id: 'prev-1',
    contestId: 'contest-1',
    roundId: 'round-1',
    slotIndex: 0,
    phase: 'scored',
    entries: [],
    ...overrides,
  } as Matchup;
}

describe('/api/contest/contests/[id]/rounds/[roundId]/seed route', () => {
  beforeEach(() => {
    getContestByParamMock.mockReset();
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue(null);
  });

  it('rejects non-admin callers', async () => {
    requireAdminMock.mockResolvedValue(
      Response.json({ message: 'Admin access required' }, { status: 403 }),
    );
    const response = await POST(makeRequest(), routeParams());
    expect(response.status).toBe(403);
  });

  it('requires entryIdPairs when seeding the first round', async () => {
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: contestWith([{ id: 'round-1' }], ['c-1', 'c-2']),
      provider: makeProvider(),
    });

    const response = await POST(makeRequest({}), routeParams());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toMatch(/entryIdPairs is required/i);
  });

  it('rejects contestants that are not part of the contest', async () => {
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: contestWith([{ id: 'round-1' }], ['c-1', 'c-2']),
      provider: makeProvider(),
    });

    const response = await POST(
      makeRequest({ entryIdPairs: [['c-1', 'c-ghost']] }),
      routeParams(),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toMatch(/c-ghost is not part of the contest/i);
  });

  it('seeds round 0 pairs + bye, deleting prior matchups and backfilling the bye winner', async () => {
    const provider = makeProvider({
      listByRound: vi.fn().mockResolvedValue({
        success: true,
        data: [prevMatchup({ id: 'stale-1' })],
      }),
    });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: contestWith([{ id: 'round-1' }], ['c-1', 'c-2', 'c-3']),
      provider,
    });

    const response = await POST(
      makeRequest({ entryIdPairs: [['c-1', 'c-2'], ['c-3']] }),
      routeParams(),
    );

    expect(response.status).toBe(200);
    // Prior matchups cleared first.
    expect(provider.matchups.delete).toHaveBeenCalledWith('contest-1', 'stale-1');
    // Pair → set phase; bye → scored phase.
    expect(provider.matchups.batchCreate).toHaveBeenCalledWith('contest-1', [
      { roundId: 'round-1', slotIndex: 0, contestantIds: ['c-1', 'c-2'], phase: 'set' },
      { roundId: 'round-1', slotIndex: 1, contestantIds: ['c-3'], phase: 'scored' },
    ]);
    // Bye winner backfilled with the lone entry id.
    expect(provider.matchups.update).toHaveBeenCalledWith('contest-1', 'created-1', {
      winnerEntryId: 'created-1-entry-0',
    });
  });

  it('rejects entryIdPairs for rounds beyond the first', async () => {
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: contestWith([{ id: 'round-1' }, { id: 'round-2' }], ['c-1', 'c-2']),
      provider: makeProvider(),
    });

    const response = await POST(
      makeRequest({ entryIdPairs: [['c-1', 'c-2']] }),
      routeParams('round-2'),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toMatch(/only allowed when seeding the first round/i);
  });

  it('blocks seeding when a previous-round matchup is not scored', async () => {
    const provider = makeProvider({
      listByRound: vi.fn().mockResolvedValue({
        success: true,
        data: [
          prevMatchup({
            id: 'prev-1',
            phase: 'shake',
            entries: [
              { id: 'e-1', contestantId: 'c-1', matchupId: 'prev-1', name: 'A' },
              { id: 'e-2', contestantId: 'c-2', matchupId: 'prev-1', name: 'B' },
            ],
          }),
        ],
      }),
    });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: contestWith([{ id: 'round-1' }, { id: 'round-2' }], ['c-1', 'c-2']),
      provider,
    });

    const response = await POST(makeRequest({}), routeParams('round-2'));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toMatch(/Cannot seed: Matchup 1: phase is 'shake'/);
  });

  it('heals a missing winner from raw score averages and persists it', async () => {
    // 37/5 = 7.4 vs 33/5 = 6.6 — both display as 7, but the raw average
    // resolves a winner (unified winnerResolution semantics).
    const update = vi.fn().mockResolvedValue({ success: true, data: {} });
    const provider = makeProvider({
      listByRound: vi.fn().mockImplementation((_c: string, roundId: string) => {
        if (roundId === 'round-1') {
          return Promise.resolve({
            success: true,
            data: [
              prevMatchup({
                id: 'prev-1',
                phase: 'scored',
                winnerEntryId: null,
                entries: [
                  { id: 'e-1', contestantId: 'c-1', matchupId: 'prev-1', name: 'A', sumScore: 37, voteCount: 5 },
                  { id: 'e-2', contestantId: 'c-2', matchupId: 'prev-1', name: 'B', sumScore: 33, voteCount: 5 },
                ],
              }),
            ],
          });
        }
        return Promise.resolve({ success: true, data: [] });
      }),
      update,
    });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: contestWith([{ id: 'round-1' }, { id: 'round-2' }], ['c-1', 'c-2']),
      provider,
    });

    const response = await POST(makeRequest({}), routeParams('round-2'));
    expect(response.status).toBe(200);
    // Healed winner written back onto the previous-round matchup.
    expect(update).toHaveBeenCalledWith('contest-1', 'prev-1', { winnerEntryId: 'e-1' });
    // Winner's contestant advances into the new round.
    expect(provider.matchups.batchCreate).toHaveBeenCalledWith('contest-1', [
      { roundId: 'round-2', slotIndex: 0, contestantIds: ['c-1'], phase: 'scored' },
    ]);
  });

  it('blocks seeding on a genuine tie with a pick-a-winner message', async () => {
    const provider = makeProvider({
      listByRound: vi.fn().mockResolvedValue({
        success: true,
        data: [
          prevMatchup({
            id: 'prev-1',
            phase: 'scored',
            winnerEntryId: null,
            entries: [
              { id: 'e-1', contestantId: 'c-1', matchupId: 'prev-1', name: 'A', sumScore: 35, voteCount: 5 },
              { id: 'e-2', contestantId: 'c-2', matchupId: 'prev-1', name: 'B', sumScore: 21, voteCount: 3 },
            ],
          }),
        ],
      }),
    });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: contestWith([{ id: 'round-1' }, { id: 'round-2' }], ['c-1', 'c-2']),
      provider,
    });

    const response = await POST(makeRequest({}), routeParams('round-2'));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toMatch(/tied — pick a winner manually/i);
  });

  it('pairs previous-round winners with a bye for odd counts and sets advancement pointers', async () => {
    const scoredPrev = (n: number) =>
      prevMatchup({
        id: `prev-${n}`,
        slotIndex: n,
        phase: 'scored',
        winnerEntryId: `e-${n}-win`,
        entries: [
          { id: `e-${n}-win`, contestantId: `c-${n}w`, matchupId: `prev-${n}`, name: 'W', sumScore: 10, voteCount: 1 },
          { id: `e-${n}-lose`, contestantId: `c-${n}l`, matchupId: `prev-${n}`, name: 'L', sumScore: 5, voteCount: 1 },
        ],
      });
    const update = vi.fn().mockResolvedValue({ success: true, data: {} });
    const provider = makeProvider({
      listByRound: vi.fn().mockImplementation((_c: string, roundId: string) => {
        if (roundId === 'round-1') {
          return Promise.resolve({ success: true, data: [scoredPrev(0), scoredPrev(1), scoredPrev(2)] });
        }
        return Promise.resolve({ success: true, data: [] });
      }),
      update,
    });
    getContestByParamMock.mockResolvedValue({
      error: null,
      contest: contestWith(
        [{ id: 'round-1' }, { id: 'round-2' }],
        ['c-0w', 'c-0l', 'c-1w', 'c-1l', 'c-2w', 'c-2l'],
      ),
      provider,
    });

    const response = await POST(makeRequest({}), routeParams('round-2'));
    expect(response.status).toBe(200);
    expect(provider.matchups.batchCreate).toHaveBeenCalledWith('contest-1', [
      { roundId: 'round-2', slotIndex: 0, contestantIds: ['c-0w', 'c-1w'], phase: 'set' },
      { roundId: 'round-2', slotIndex: 1, contestantIds: ['c-2w'], phase: 'scored' },
    ]);
    // Advancement pointers: prev slots 0,1 → created-0; prev slot 2 → created-1.
    expect(update).toHaveBeenCalledWith('contest-1', 'prev-0', {
      advancesToMatchupId: 'created-0',
      advancesToSlot: 0,
    });
    expect(update).toHaveBeenCalledWith('contest-1', 'prev-1', {
      advancesToMatchupId: 'created-0',
      advancesToSlot: 1,
    });
    expect(update).toHaveBeenCalledWith('contest-1', 'prev-2', {
      advancesToMatchupId: 'created-1',
      advancesToSlot: 0,
    });
  });
});
