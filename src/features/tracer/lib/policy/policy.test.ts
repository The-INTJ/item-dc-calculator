// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { TracerError } from '../errors';
import { negotiateDraw, releaseSeat } from '../server/commands';
import { activeGame, ALICE, BOB, CAROL, finishedGame, hotseatGame, openGame, T0 } from '../fixtures/game';
import { deriveViewer } from './viewer';
import { canReleaseSeat, SEAT_RELEASE_AFTER_MS, seatReleaseAvailableAt } from './seats';

describe('deriveViewer', () => {
  it('sees a seated player from their own side', () => {
    expect(deriveViewer(activeGame(), BOB.uid)).toMatchObject({
      role: 'player', sides: ['b'], actingSide: 'b', canMove: false, canJoin: false, orientation: 'b',
    });
    expect(deriveViewer(activeGame(), ALICE.uid)).toMatchObject({ canMove: true, orientation: 'w' });
  });

  it('lets a stranger join an open game, and only watch a full one', () => {
    expect(deriveViewer(openGame(), CAROL.uid)).toMatchObject({ role: 'spectator', canJoin: true });
    expect(deriveViewer(activeGame(), CAROL.uid)).toMatchObject({ canJoin: false, orientation: 'w' });
    expect(deriveViewer(activeGame(), null)).toMatchObject({ role: 'spectator', canMove: false });
  });

  it('follows the side to move in hotseat', () => {
    const viewer = deriveViewer(hotseatGame({ state: { ...hotseatGame().state, ply: 1 } }), ALICE.uid);
    expect(viewer).toMatchObject({ role: 'both', actingSide: 'b', orientation: 'b', canMove: true });
  });

  it('never lets anyone move in a finished game', () => {
    expect(deriveViewer(finishedGame(), ALICE.uid).canMove).toBe(false);
  });
});

describe('seat release', () => {
  const stalled = activeGame({ turnStartedAt: T0 });
  const later = T0 + SEAT_RELEASE_AFTER_MS;

  it('opens to the opponent once it has been that side’s move long enough', () => {
    expect(seatReleaseAvailableAt(stalled, 'w')).toBe(later);
    expect(canReleaseSeat(stalled, BOB.uid, 'w', later - 1)).toBe(false);
    expect(canReleaseSeat(stalled, BOB.uid, 'w', later)).toBe(true);
  });

  it('is never available to strangers, for your own seat, or off-turn', () => {
    expect(canReleaseSeat(stalled, CAROL.uid, 'w', later)).toBe(false);
    expect(canReleaseSeat(stalled, ALICE.uid, 'w', later)).toBe(false);
    expect(canReleaseSeat(stalled, ALICE.uid, 'b', later)).toBe(false);
    expect(canReleaseSeat(hotseatGame(), ALICE.uid, 'w', later)).toBe(false);
  });

  it('keeps the old name on the reopened seat', () => {
    const result = releaseSeat(stalled, BOB, 'w', later);
    expect(result.game?.seats.w).toEqual({ uid: null, name: 'Alice', joinedAt: null });
    expect(() => releaseSeat(stalled, BOB, 'w', later - 1)).toThrow(TracerError);
  });
});

describe('draw negotiation', () => {
  it('offers, then lets only the opponent answer', () => {
    const offered = negotiateDraw(activeGame(), ALICE, 'offer', T0).game!;
    expect(offered.drawOffer).toEqual({ by: 'w', at: T0, ply: 0 });
    expect(() => negotiateDraw(offered, ALICE, 'accept', T0)).toThrow(/no draw offer/i);
    expect(() => negotiateDraw(offered, BOB, 'offer', T0)).toThrow(/already offered/i);
    const accepted = negotiateDraw(offered, BOB, 'accept', T0 + 1);
    expect(accepted.game).toMatchObject({ status: 'finished', drawOffer: null });
    expect(accepted.response.result).toMatchObject({ status: 'drawn', reason: 'agreement' });
  });

  it('declines and withdraws', () => {
    const offered = negotiateDraw(activeGame(), BOB, 'offer', T0).game!;
    expect(negotiateDraw(offered, ALICE, 'decline', T0).game?.drawOffer).toBeNull();
    expect(negotiateDraw(offered, BOB, 'withdraw', T0).game?.drawOffer).toBeNull();
    expect(negotiateDraw(offered, BOB, 'offer', T0).game).toBeNull();
  });

  it('works for one person holding both seats', () => {
    const offered = negotiateDraw(hotseatGame(), ALICE, 'offer', T0).game!;
    expect(negotiateDraw(offered, ALICE, 'accept', T0).game?.status).toBe('finished');
  });

  it('is closed once the game is over', () => {
    expect(() => negotiateDraw(finishedGame(), ALICE, 'offer', T0)).toThrow(TracerError);
  });
});
