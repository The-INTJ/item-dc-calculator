import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const getContestByParamMock = vi.fn();
const requireAuthMock = vi.fn();

vi.mock('@/contest/lib/backend/serverProvider', () => ({
  getContestByParam: (contestId: string) => getContestByParamMock(contestId),
}));

vi.mock('../../../../../_lib/requireAuth', () => ({
  requireAuth: (request: Request) => requireAuthMock(request),
}));

const authedUser = {
  uid: 'user-1',
  displayName: 'Test User',
  role: 'voter' as const,
};

function makeRequest(body: unknown): Request {
  return new Request(
    'http://localhost/api/contest/contests/contest-1/matchups/matchup-1/ballot',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

const routeParams = { params: Promise.resolve({ id: 'contest-1', matchupId: 'matchup-1' }) };

const shakeMatchup = {
  id: 'matchup-1',
  phase: 'shake',
  entries: [
    { id: 'entry-1', contestantId: 'c-1', matchupId: 'matchup-1', name: 'A' },
    { id: 'entry-2', contestantId: 'c-2', matchupId: 'matchup-1', name: 'B' },
  ],
};

function makeContext(overrides: {
  matchup?: unknown;
  config?: unknown;
  voters?: unknown[];
  submitBallot?: ReturnType<typeof vi.fn>;
  getById?: ReturnType<typeof vi.fn>;
} = {}) {
  const submitBallot =
    overrides.submitBallot ??
    vi.fn().mockResolvedValue({ success: true, data: [{ id: 's-1' }, { id: 's-2' }] });
  const createVoter = vi.fn().mockResolvedValue({ success: true, data: null });
  const getById = overrides.getById ?? vi.fn().mockResolvedValue({ success: true, data: null });
  getContestByParamMock.mockResolvedValue({
    error: null,
    contest: {
      id: 'contest-1',
      ...(overrides.config !== undefined ? { config: overrides.config } : {}),
      contestants: [{ id: 'c-1', displayName: 'A' }],
      voters: overrides.voters ?? [],
    },
    provider: {
      matchups: {
        getById: vi.fn().mockResolvedValue({ success: true, data: overrides.matchup ?? shakeMatchup }),
      },
      scores: { submitBallot, getById },
      voters: { create: createVoter },
    },
  });
  return { submitBallot, createVoter, getById };
}

describe('/api/contest/contests/[id]/matchups/[matchupId]/ballot POST', () => {
  beforeEach(() => {
    getContestByParamMock.mockReset();
    requireAuthMock.mockReset();
    requireAuthMock.mockResolvedValue({ user: authedUser, response: null });
  });

  it('rejects unauthenticated callers', async () => {
    requireAuthMock.mockResolvedValue({
      user: null,
      response: Response.json({ message: 'Authentication required' }, { status: 401 }),
    });
    const response = await POST(
      makeRequest({ scores: [{ entryId: 'entry-1', breakdown: { taste: 8 } }] }),
      routeParams,
    );
    expect(response.status).toBe(401);
  });

  it('rejects an empty ballot at the schema layer', async () => {
    makeContext();
    const response = await POST(makeRequest({ scores: [] }), routeParams);
    expect(response.status).toBe(400);
  });

  it('rejects with MATCHUP_CLOSED when the matchup is not shaking', async () => {
    makeContext({ matchup: { ...shakeMatchup, phase: 'scored' } });
    const response = await POST(
      makeRequest({ scores: [{ entryId: 'entry-1', breakdown: { taste: 8 } }] }),
      routeParams,
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('MATCHUP_CLOSED');
  });

  it('rejects entries that are not part of the matchup', async () => {
    makeContext();
    const response = await POST(
      makeRequest({ scores: [{ entryId: 'entry-ghost', breakdown: { taste: 8 } }] }),
      routeParams,
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toMatch(/not part of this matchup/i);
  });

  it('validates every breakdown against the config and reports all failures', async () => {
    const { submitBallot } = makeContext({
      config: { topic: 'Mixology', attributes: [{ id: 'taste', label: 'Taste', min: 1, max: 10 }] },
    });
    const response = await POST(
      makeRequest({
        scores: [
          { entryId: 'entry-1', breakdown: { taste: 11 } },
          { entryId: 'entry-2', breakdown: { taste: 0 } },
        ],
      }),
      routeParams,
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('SCORE_INVALID');
    expect(body.message).toContain('entry-1');
    expect(body.message).toContain('entry-2');
    expect(submitBallot).not.toHaveBeenCalled();
  });

  it('submits the whole ballot with the token uid and auto-registers the voter', async () => {
    const { submitBallot, createVoter } = makeContext();
    const response = await POST(
      makeRequest({
        userName: 'Ballot Voter',
        scores: [
          { entryId: 'entry-1', breakdown: { taste: 8 } },
          { entryId: 'entry-2', breakdown: { taste: 6 } },
        ],
      }),
      routeParams,
    );

    expect(response.status).toBe(200);
    expect(createVoter).toHaveBeenCalledWith('contest-1', {
      id: 'user-1',
      displayName: 'Ballot Voter',
      role: 'voter',
    });
    expect(submitBallot).toHaveBeenCalledWith('contest-1', {
      matchupId: 'matchup-1',
      userId: 'user-1',
      scores: [
        { entryId: 'entry-1', breakdown: { taste: 8 } },
        { entryId: 'entry-2', breakdown: { taste: 6 } },
      ],
    });
  });

  it('maps an in-transaction phase rejection to 409 MATCHUP_CLOSED', async () => {
    const { submitBallot } = makeContext({
      submitBallot: vi.fn().mockResolvedValue({
        success: false,
        error: 'Matchup is not open for scoring',
      }),
    });
    const response = await POST(
      makeRequest({ scores: [{ entryId: 'entry-1', breakdown: { taste: 8 } }] }),
      routeParams,
    );
    expect(submitBallot).toHaveBeenCalled();
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe('MATCHUP_CLOSED');
  });
});
