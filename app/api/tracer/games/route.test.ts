// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const createNewGameMock = vi.fn();
const requireAuthMock = vi.fn();

vi.mock('@/features/tracer/lib/server', () => ({
  createNewGame: (...args: unknown[]) => createNewGameMock(...args),
}));

vi.mock('@/app/api/contest/_lib/requireAuth', () => ({
  requireAuth: (request: Request) => requireAuthMock(request),
}));

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/tracer/games', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('POST /api/tracer/games', () => {
  beforeEach(() => {
    createNewGameMock.mockReset();
    requireAuthMock.mockResolvedValue({ user: { uid: 'alice-uid' }, response: null });
  });

  it('creates a game for the caller and answers 201', async () => {
    createNewGameMock.mockResolvedValue({ gameId: 'AbCdEfGhIjKlMnOpQrSt' });
    const response = await post({ displayName: ' Alice ', seat: 'random' });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ gameId: 'AbCdEfGhIjKlMnOpQrSt' });
    expect(createNewGameMock).toHaveBeenCalledWith(
      { uid: 'alice-uid' },
      { displayName: 'Alice', seat: 'random' },
    );
  });

  it('rejects an unknown seat choice', async () => {
    const response = await post({ displayName: 'Alice', seat: 'purple' });
    expect(response.status).toBe(400);
    expect(createNewGameMock).not.toHaveBeenCalled();
  });
});
