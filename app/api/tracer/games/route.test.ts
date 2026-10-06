// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_STYLE_ID, ORIGINAL_V1 } from '@/features/tracer/variants';

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
      { displayName: 'Alice', seat: 'random', styleId: DEFAULT_STYLE_ID },
    );
  });

  it('passes a published style with tweaked rules through', async () => {
    createNewGameMock.mockResolvedValue({ gameId: 'AbCdEfGhIjKlMnOpQrSt' });
    const rules = { ...ORIGINAL_V1.rules, kingMemory: 'none', dodgeDraw: 0 };
    const response = await post({ displayName: 'Alice', seat: 'w', styleId: 'v1-original', rules });
    expect(response.status).toBe(201);
    expect(createNewGameMock.mock.calls[0][1]).toMatchObject({ styleId: 'v1-original', rules });
  });

  it('rejects an unknown style, an unknown layout, or rules that break the schema', async () => {
    const layout = { ...ORIGINAL_V1.rules.layout, id: 'homebrew' };
    const bodies = [
      { styleId: 'v9-secret' },
      { styleId: 'v1-original', rules: { ...ORIGINAL_V1.rules, layout } },
      { styleId: 'v1-original', rules: { ...ORIGINAL_V1.rules, dodgeDraw: -1 } },
    ];
    for (const body of bodies) {
      const response = await post({ displayName: 'Alice', seat: 'w', ...body });
      expect(response.status).toBe(400);
    }
    expect(createNewGameMock).not.toHaveBeenCalled();
  });

  it('rejects an unknown seat choice', async () => {
    const response = await post({ displayName: 'Alice', seat: 'purple' });
    expect(response.status).toBe(400);
    expect(createNewGameMock).not.toHaveBeenCalled();
  });
});
