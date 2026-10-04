/**
 * Reading what earlier versions of Tracer saved. The golden v1 games were
 * self-played by the engine exactly as it shipped to production (see the
 * fixture's _source); replaying them under the Original (v1) style must
 * reproduce every turn and the final position. If this fails, a change has
 * altered how Original games play — friends' saved games would break.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { applyTurn, initialState, replayTurns, sideToMove, turnInputFromRecord } from '../../../engine';
import type { GameState, TurnRecord } from '../../../engine';
import type { TracerGame } from '../../types';
import { randomTurn, seeded } from '../../../engine/fixtures/self-play';
import { ORIGINAL_V1, TIERED_V2, tweaksBetween } from '../../../variants';
import { ALICE, BOB, T0 } from '../../fixtures/game';
import { undoLocalTurn } from '../../local/localGame';
import { loadLocalGame } from '../../local/localStore';
import { submitTurn } from '../../server/commands';
import { fromGameDoc, isNewerGameDoc, toGameDoc } from '../gameDocument';
import { GameStateSchema } from '../stateSchema';
import { TIERED_V2_AS_PLAYED, upcastState } from './state';
import golden from './fixtures/v1-golden.json';
import v2Doc from './fixtures/v2-game-doc.json';
import v2Local from './fixtures/v2-local-record.json';
import v3Launch from './fixtures/v3-launch-doc.json';

type GoldenGame = (typeof golden.games)[number];

/** v1 chart records also carried `key` and `libraryAdded`; the schema drops them. */
function withoutV1Extras(record: unknown): TurnRecord {
  const stored = record as { actions: Record<string, unknown>[] };
  const actions = stored.actions.map(({ key: _key, libraryAdded: _added, ...action }) => action);
  return { ...(record as TurnRecord), actions } as unknown as TurnRecord;
}

/** v1 never stored a captured Tracer's last pattern, so the upcast knows only the living ones. */
function livingOnly(state: GameState): GameState {
  const living = new Set(state.pieces.map((piece) => piece.id));
  const keep = (lent: Record<string, string>) => Object.fromEntries(Object.entries(lent).filter(([id]) => living.has(id)));
  return { ...state, lastCharted: { w: keep(state.lastCharted.w), b: keep(state.lastCharted.b) } };
}

function replayGolden(game: GoldenGame): GameState {
  let state = initialState(ORIGINAL_V1.rules);
  for (const stored of game.turns) {
    const record = withoutV1Extras(stored);
    const outcome = applyTurn(state, record.side, turnInputFromRecord(record)!);
    if (!outcome.ok) throw new Error(`seed ${game.seed}, ply ${record.ply}: ${outcome.code}`);
    expect(outcome.record).toEqual(record);
    state = outcome.state;
  }
  return state;
}

/** Play one legal turn in `game` through the server command; returns the stored-and-reread game. */
function playNextTurn(game: TracerGame, clientTurnId: string): TracerGame {
  const rng = seeded(7);
  const side = sideToMove(game.state);
  let turn = randomTurn(rng, game.state, side);
  while (!applyTurn(game.state, side, turn).ok) turn = randomTurn(rng, game.state, side);
  const actor = game.seats[side].uid === ALICE.uid ? ALICE : BOB;
  const played = submitTurn(game, actor, { clientTurnId, turn }, T0 + 61).game!;
  return fromGameDoc(played.id, JSON.parse(JSON.stringify(toGameDoc(played))))!;
}

/** A v1 game document around a golden game's final position. */
function v1GameDoc(game: GoldenGame) {
  const last = game.turns[game.turns.length - 1];
  const seat = (uid: string, name: string) => ({ uid, name, joinedAt: T0 });
  return {
    schemaVersion: 1,
    status: game.finalState.result.status === 'active' ? 'active' : 'finished',
    mode: 'online',
    createdBy: { uid: ALICE.uid, name: 'Alice' },
    seats: { w: seat(ALICE.uid, 'Alice'), b: seat(BOB.uid, 'Bob') },
    state: game.finalState,
    lastTurn: { ...last, at: T0 + 60, clientTurnId: 'golden-last-turn' },
    drawOffer: null,
    rematchOf: null,
    rematchGameId: null,
    createdAt: T0,
    updatedAt: T0 + 60,
    startedAt: T0,
    turnStartedAt: T0 + 60,
    finishedAt: null,
  };
}

describe('Original (v1) games saved by production', () => {
  it.each(golden.games.map((game) => [game.seed, game] as const))('seed %i replays turn for turn', (_seed, game) => {
    const replayed = replayGolden(game);
    const upcast = GameStateSchema.parse(upcastState(game.finalState));
    expect(livingOnly(replayed)).toEqual(upcast);
  });

  it('keeps an active game playable: it reads as Original (v1) and takes its next turn', () => {
    const active = golden.games.find((game) => game.finalState.result.status === 'active')!;
    const game = fromGameDoc('GoldenV1Doc00000000a', v1GameDoc(active));
    expect(game).toMatchObject({ schemaVersion: 3, style: { id: 'v1-original' }, state: { rules: ORIGINAL_V1.rules } });
    const next = playNextTurn(game!, 'after-upgrade-1');
    expect(next.state.ply).toBe(game!.state.ply + 1);
  });
});

describe('Tiered (v2) records from the local-only branch', () => {
  beforeEach(() => window.localStorage.clear());

  it('reads a v2 game document as Tiered (v2) under the rules it was played by', () => {
    const game = fromGameDoc(v2Doc.id, v2Doc.doc);
    expect(game).toMatchObject({ schemaVersion: 3, style: { id: 'v2-tiered' }, state: { rules: TIERED_V2_AS_PLAYED } });
    expect(tweaksBetween(TIERED_V2, game!.state.rules)).toEqual(['dodgeDraw', 'dodgeNeedsThreat']);
    expect(game!.state.lastCharted).toEqual(v2Doc.doc.state.kingPatterns);
  });

  it('reads a v2 local game, matching a fresh replay of its moves, and undo still works', () => {
    const { record } = v2Local;
    window.localStorage.setItem(`tracer:local:${record.id}`, JSON.stringify(record));
    const loaded = loadLocalGame(record.id)!;
    expect(loaded).toMatchObject({ style: { id: 'v2-tiered' }, turns: record.turns });
    expect(replayTurns(loaded.state.rules, loaded.turns)).toEqual(loaded.state);
    const undone = undoLocalTurn(loaded, T0);
    expect(undone.turns).toHaveLength(record.turns.length - 1);
    expect(undone.state.ply).toBe(loaded.state.ply - 1);
  });
});

describe('documents written by this version', () => {
  it('always parse and keep playing — new rule fields must default to how games played before them', () => {
    const game = fromGameDoc(v3Launch.id, v3Launch.doc);
    expect(game).toMatchObject({ style: v3Launch.doc.style, state: { ply: v3Launch.doc.state.ply } });
    expect(playNextTurn(game!, 'after-launch-1').state.ply).toBe(v3Launch.doc.state.ply + 1);
  });

  it('flag only documents from a newer version as unreadable', () => {
    expect(isNewerGameDoc({ schemaVersion: 4 })).toBe(true);
    expect(isNewerGameDoc(v3Launch.doc)).toBe(false);
    expect(isNewerGameDoc({ schemaVersion: 1 })).toBe(false);
  });
});
