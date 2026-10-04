// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { activeGame, OPENING_CHART, T0 } from '../fixtures/game';
import { CreateGameSchema, isGameId, SubmitTurnSchema } from '../schemas';
import { submitTurn } from '../server/commands';
import { fromGameDoc, fromTurnDoc, isOutdatedGameDoc, toGameDoc, turnDocId } from './gameDocument';

describe('game documents', () => {
  it('round-trip through the stored shape', () => {
    const played = submitTurn(activeGame(), { uid: 'alice-uid' }, OPENING_CHART, T0).game!;
    const stored = JSON.parse(JSON.stringify(toGameDoc(played)));
    expect(stored.id).toBeUndefined();
    expect(fromGameDoc(played.id, stored)).toEqual(played);
  });

  it('reject malformed documents instead of guessing', () => {
    const doc = toGameDoc(activeGame());
    expect(fromGameDoc('x', { ...doc, status: 'paused' })).toBeNull();
    const badPiece = { ...doc.state.pieces[0], at: 'z9' };
    expect(fromGameDoc('x', { ...doc, state: { ...doc.state, pieces: [badPiece] } })).toBeNull();
    const badPattern = { ...doc.state, lastCharted: { w: { wT3: 'R:5' }, b: {} } };
    expect(fromGameDoc('x', { ...doc, state: badPattern })).toBeNull();
    const twoKings = { ...doc.state.rules.layout, pieces: [...doc.state.rules.layout.pieces, { id: 'K2', kind: 'king', file: 'a', row: 0, tier: null }] };
    expect(fromGameDoc('x', { ...doc, state: { ...doc.state, rules: { ...doc.state.rules, layout: twoKings } } })).toBeNull();
  });

  it('recognise games saved under the first rules', () => {
    expect(isOutdatedGameDoc({ schemaVersion: 1 })).toBe(true);
    expect(isOutdatedGameDoc(toGameDoc(activeGame()))).toBe(false);
    expect(isOutdatedGameDoc(null)).toBe(false);
  });

  it('parse stored turns and key them by padded ply', () => {
    const { turn } = submitTurn(activeGame(), { uid: 'alice-uid' }, OPENING_CHART, T0);
    expect(fromTurnDoc(JSON.parse(JSON.stringify(turn)))).toEqual(turn);
    expect(fromTurnDoc({ ...turn, side: 'x' })).toBeNull();
    expect(turnDocId(7)).toBe('0007');
  });
});

describe('request schemas', () => {
  it('trims names and rejects empty, long, or control-character names', () => {
    const base = { seat: 'w' };
    expect(CreateGameSchema.parse({ ...base, displayName: '  Sam  ' }).displayName).toBe('Sam');
    expect(CreateGameSchema.safeParse({ ...base, displayName: '   ' }).success).toBe(false);
    expect(CreateGameSchema.safeParse({ ...base, displayName: 'x'.repeat(25) }).success).toBe(false);
    expect(CreateGameSchema.safeParse({ ...base, displayName: 'Sam\nEvil' }).success).toBe(false);
    expect(CreateGameSchema.safeParse({ ...base, displayName: 'Zoë 🎲' }).success).toBe(true);
  });

  it('validates turn submissions structurally', () => {
    expect(SubmitTurnSchema.safeParse(OPENING_CHART).success).toBe(true);
    const badPath = { ...OPENING_CHART, turn: { ...OPENING_CHART.turn, main: { kind: 'chart', from: 'b1', steps: '805' } } };
    expect(SubmitTurnSchema.safeParse(badPath).success).toBe(false);
    expect(SubmitTurnSchema.safeParse({ ...OPENING_CHART, clientTurnId: 'no spaces!' }).success).toBe(false);
  });

  it('recognises game ids', () => {
    expect(isGameId('AbCdEfGhIjKlMnOpQrSt')).toBe(true);
    expect(isGameId('short')).toBe(false);
    expect(isGameId('AbCdEfGhIjKlMnOpQr/t')).toBe(false);
  });
});
