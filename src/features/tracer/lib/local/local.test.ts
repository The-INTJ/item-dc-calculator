import { beforeEach, describe, expect, it } from 'vitest';

import { deriveViewer } from '../policy';
import {
  endLocalGame,
  localAsTracerGame,
  LOCAL_GAME_ID,
  LOCAL_UID,
  newLocalGame,
  playLocalTurn,
  undoLocalTurn,
  type LocalGameRecord,
} from './localGame';
import { loadLocalGame, newLocalGameId, saveLocalGame } from './localStore';

const ID = 'local-abcde12345';
const T0 = 1_700_000_000_000;

function played(record: LocalGameRecord, from: string, to: string): LocalGameRecord {
  const outcome = playLocalTurn(record, { ply: record.state.ply, main: { kind: 'move', from, to }, freeStep: null }, T0);
  if (!outcome.ok) throw new Error(outcome.code);
  return outcome.record;
}

describe('local games', () => {
  it('play turns through the engine and keep the move list', () => {
    const game = played(played(newLocalGame(ID, T0), 'd2', 'd3'), 'd7', 'd6');
    expect(game.state.ply).toBe(2);
    expect(game.turns.map((turn) => turn.side)).toEqual(['w', 'b']);
    const illegal = playLocalTurn(game, { ply: 2, main: { kind: 'move', from: 'd3', to: 'd6' }, freeStep: null }, T0);
    expect(illegal).toMatchObject({ ok: false, code: 'UNREACHABLE' });
  });

  it('undo takes back the last turn, and nothing before the first', () => {
    const start = newLocalGame(ID, T0);
    const game = played(played(start, 'd2', 'd3'), 'd7', 'd6');
    const undone = undoLocalTurn(game, T0 + 1);
    expect(undone.turns).toHaveLength(1);
    expect(undone.state).toEqual(played(start, 'd2', 'd3').state);
    expect(undoLocalTurn(start, T0)).toBe(start);
  });

  it('undo after a resignation reopens the game without losing a move', () => {
    const game = played(newLocalGame(ID, T0), 'd2', 'd3');
    const resigned = endLocalGame(game, 'resign', T0);
    expect(resigned.state.result).toMatchObject({ status: 'won', winner: 'w', reason: 'resignation' });
    const reopened = undoLocalTurn(resigned, T0);
    expect(reopened.state).toEqual(game.state);
    expect(reopened.turns).toHaveLength(1);
  });

  it('reads like an online game played by one person on both sides', () => {
    const game = localAsTracerGame(played(newLocalGame(ID, T0), 'd2', 'd3'));
    expect(game.seats.w).toMatchObject({ uid: LOCAL_UID, name: 'White' });
    expect(game.seats.b).toMatchObject({ uid: LOCAL_UID, name: 'Black' });
    expect(game.lastTurn?.ply).toBe(0);
    expect(deriveViewer(game, LOCAL_UID)).toMatchObject({ role: 'both', canMove: true, orientation: 'b' });
  });
});

describe('local game storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('saves and reloads a game exactly', () => {
    const start = newLocalGame(ID, T0);
    const charted = playLocalTurn(start, { ply: 0, main: { kind: 'chart', from: 'g1', steps: '98' }, freeStep: null }, T0);
    if (!charted.ok) throw new Error(charted.code);
    expect(charted.record.state.kingPatterns.w).toEqual({ wT5: 'R:98' });
    expect(saveLocalGame(charted.record)).toBe(true);
    expect(loadLocalGame(ID)).toEqual(charted.record);
  });

  it('reads anything unexpected as missing', () => {
    expect(loadLocalGame('not-a-local-id')).toBeNull();
    window.localStorage.setItem(`tracer:local:${ID}`, '{broken');
    expect(loadLocalGame(ID)).toBeNull();
    window.localStorage.setItem(`tracer:local:${ID}`, JSON.stringify({ ...newLocalGame(ID, T0), state: { rulesVersion: 1 } }));
    expect(loadLocalGame(ID)).toBeNull();
  });

  it('mints ids in the local format', () => {
    expect(newLocalGameId()).toMatch(LOCAL_GAME_ID);
  });
});
