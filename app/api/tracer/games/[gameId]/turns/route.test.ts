// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

import { TracerError } from '@/features/tracer/lib/errors';
import { GAME_ID, OPENING_CHART } from '@/features/tracer/lib/fixtures/game';

import { POST } from './route';

const playTurnMock = vi.fn();
const requireAuthMock = vi.fn();

vi.mock('@/features/tracer/lib/server', () => ({
  playTurn: (...args: unknown[]) => playTurnMock(...args),
}));

vi.mock('@/app/api/contest/_lib/requireAuth', () => ({
  requireAuth: (request: Request) => requireAuthMock(request),
}));

function post(body: unknown, gameId = GAME_ID) {
  const request = new Request(`http://localhost/api/tracer/games/${gameId}/turns`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return POST(request, { params: Promise.resolve({ gameId }) });
}

describe('POST /api/tracer/games/[gameId]/turns', () => {
  beforeEach(() => {
    playTurnMock.mockReset();
    requireAuthMock.mockReset();
    requireAuthMock.mockResolvedValue({ user: { uid: 'alice-uid', displayName: 'User', role: 'voter' }, response: null });
  });

  it('passes the verified caller and parsed turn to the service', async () => {
    playTurnMock.mockResolvedValue({ ply: 1, status: 'active', replayed: false });
    const response = await post(OPENING_CHART);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ply: 1, status: 'active', replayed: false });
    expect(playTurnMock).toHaveBeenCalledWith(GAME_ID, { uid: 'alice-uid' }, OPENING_CHART);
  });

  it('returns the auth guard’s 401 untouched', async () => {
    requireAuthMock.mockResolvedValue({ user: null, response: NextResponse.json({}, { status: 401 }) });
    expect((await post(OPENING_CHART)).status).toBe(401);
    expect(playTurnMock).not.toHaveBeenCalled();
  });

  it('treats a malformed game id as not found', async () => {
    const response = await post(OPENING_CHART, 'not-a-game');
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'GAME_NOT_FOUND' });
  });

  it('rejects a malformed body with field errors', async () => {
    const response = await post({ clientTurnId: 'turn-0001-abc', turn: { ply: 0 } });
    expect(response.status).toBe(400);
    expect((await response.json()).errors.length).toBeGreaterThan(0);
  });

  it('maps typed errors to their status, code and reason', async () => {
    playTurnMock.mockRejectedValueOnce(new TracerError('STALE_PLY', 'stale'));
    const stale = await post(OPENING_CHART);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ message: 'stale', code: 'STALE_PLY' });

    playTurnMock.mockRejectedValueOnce(new TracerError('ILLEGAL_TURN', 'nope', 'UNREACHABLE'));
    const illegal = await post(OPENING_CHART);
    expect(illegal.status).toBe(422);
    expect(await illegal.json()).toMatchObject({ code: 'ILLEGAL_TURN', reason: 'UNREACHABLE' });
  });

  it('hides unexpected failures behind a 500', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    playTurnMock.mockRejectedValueOnce(new Error('boom'));
    const response = await post(OPENING_CHART);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: 'Something went wrong.', code: 'INTERNAL' });
    spy.mockRestore();
  });
});
