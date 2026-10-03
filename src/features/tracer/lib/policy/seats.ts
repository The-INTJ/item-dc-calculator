/**
 * Seat rules: who holds which side, which seat is free, and when a stalled
 * player's seat may be reopened so they can rejoin from a new browser.
 */

import { otherSide, sideToMove, type Side } from '../../engine';
import type { TracerGame } from '../types';

/** A seat may be reopened once it has been that side's move this long. */
export const SEAT_RELEASE_AFTER_MS = 15 * 60 * 1000;

const SIDES: readonly Side[] = ['w', 'b'];

export function seatsHeldBy(game: TracerGame, uid: string | null): Side[] {
  if (!uid) return [];
  return SIDES.filter((side) => game.seats[side].uid === uid);
}

export function emptySeat(game: TracerGame): Side | null {
  return SIDES.find((side) => game.seats[side].uid === null) ?? null;
}

/** When the opponent may reopen `side`'s seat, or null if it never can now. */
export function seatReleaseAvailableAt(game: TracerGame, side: Side): number | null {
  if (game.status !== 'active') return null;
  if (!game.seats[side].uid || sideToMove(game.state) !== side) return null;
  if (game.seats.w.uid === game.seats.b.uid) return null;
  return game.turnStartedAt === null ? null : game.turnStartedAt + SEAT_RELEASE_AFTER_MS;
}

export function canReleaseSeat(game: TracerGame, actorUid: string, side: Side, now: number): boolean {
  const opener = game.seats[otherSide(side)].uid;
  if (opener !== actorUid || game.seats[side].uid === actorUid) return false;
  const availableAt = seatReleaseAvailableAt(game, side);
  return availableAt !== null && now >= availableAt;
}
