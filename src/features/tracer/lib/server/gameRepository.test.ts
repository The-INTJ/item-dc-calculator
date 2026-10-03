// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { activeGame, ALICE, GAME_ID, OPENING_CHART, T0 } from '../fixtures/game';
import { toGameDoc } from '../storage/gameDocument';
import { submitTurn } from './commands';

vi.mock('server-only', () => ({}));

const store = new Map<string, unknown>();
let configured = true;

function snapshotOf(path: string) {
  const data = store.get(path);
  return { id: path.split('/').pop(), exists: data !== undefined, data: () => structuredClone(data) };
}

function docRef(path: string): Record<string, unknown> {
  return {
    id: path.split('/').pop(),
    path,
    collection: (name: string) => collectionRef(`${path}/${name}`),
    get: async () => snapshotOf(path),
    create: async (data: unknown) => {
      if (store.has(path)) throw new Error(`exists: ${path}`);
      store.set(path, structuredClone(data));
    },
  };
}

function collectionRef(path: string) {
  return { doc: (id = 'AutoId00000000000000') => docRef(`${path}/${id}`) };
}

const fakeDb = {
  collection: (name: string) => collectionRef(name),
  runTransaction: async <T>(work: (tx: unknown) => Promise<T>) => {
    const writes: (() => void)[] = [];
    const tx = {
      get: async (ref: { path: string }) => snapshotOf(ref.path),
      set: (ref: { path: string }, data: unknown) => writes.push(() => store.set(ref.path, structuredClone(data))),
      create: (ref: { path: string }, data: unknown) =>
        writes.push(() => {
          if (store.has(ref.path)) throw new Error(`exists: ${ref.path}`);
          store.set(ref.path, structuredClone(data));
        }),
    };
    const result = await work(tx);
    writes.forEach((write) => write());
    return result;
  },
};

vi.mock('@/contest/lib/firebase/admin', () => ({
  getFirebaseAdminFirestore: () => (configured ? fakeDb : null),
}));

const { insertGame, loadGame, runGameCommand } = await import('./gameRepository');

describe('gameRepository', () => {
  beforeEach(() => {
    store.clear();
    configured = true;
  });

  it('stores and loads a game without its id field', async () => {
    await insertGame(activeGame());
    expect(store.get(`tracerGames/${GAME_ID}`)).toEqual(toGameDoc(activeGame()));
    expect(await loadGame(GAME_ID)).toEqual(activeGame());
    expect(await loadGame('Missing0000000000000')).toBeNull();
  });

  it('writes the game and its turn document together', async () => {
    await insertGame(activeGame());
    const response = await runGameCommand(GAME_ID, (game) => submitTurn(game, ALICE, OPENING_CHART, T0));
    expect(response).toEqual({ ply: 1, status: 'active', replayed: false });
    expect(store.get(`tracerGames/${GAME_ID}/turns/0000`)).toMatchObject({ ply: 0, byUid: ALICE.uid });
    expect((await loadGame(GAME_ID))?.state.ply).toBe(1);
  });

  it('writes nothing when a command changes nothing', async () => {
    await insertGame(activeGame());
    await runGameCommand(GAME_ID, () => ({ response: 'noop', game: null, turn: null, newGame: null }));
    expect([...store.keys()]).toEqual([`tracerGames/${GAME_ID}`]);
  });

  it('reports missing, corrupt, and unconfigured storage with typed errors', async () => {
    const noop = () => ({ response: null, game: null, turn: null, newGame: null });
    await expect(runGameCommand(GAME_ID, noop)).rejects.toMatchObject({ code: 'GAME_NOT_FOUND' });
    store.set(`tracerGames/${GAME_ID}`, { schemaVersion: 99 });
    await expect(runGameCommand(GAME_ID, noop)).rejects.toMatchObject({ code: 'CORRUPT_GAME' });
    configured = false;
    await expect(loadGame(GAME_ID)).rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE' });
  });
});
