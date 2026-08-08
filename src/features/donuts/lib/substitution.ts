/**
 * Who fills in when the scheduled person can't.
 *
 * Two distinct rules live here, because the group uses two:
 *
 * - `pickStandIn` covers a *standing* absence (a regular who is inactive right
 *   now). It walks the remaining regulars in rotation order using a counter,
 *   so the same person never covers twice in a row.
 * - `pickLongestSince` covers a *one-off* "I cannot do it". It hands the date
 *   to whoever has gone longest without a turn, which self-corrects over time.
 */

import type { DonutBoard, DonutPerson, IsoDate } from './types';

/** Names preferred when the history is thin and several people are tied. */
export const FALLBACK_PREFERENCE = ['Caleb', 'Will Brantley'];

/** Last Sunday each person took, keyed by person id. Absent means never. */
export type LastTurnMap = Map<string, IsoDate>;

function preferenceRank(person: DonutPerson): number {
  const index = FALLBACK_PREFERENCE.findIndex(
    (name) => name.toLowerCase() === person.name.trim().toLowerCase(),
  );
  return index === -1 ? FALLBACK_PREFERENCE.length : index;
}

/**
 * Rank candidates by how long it has been since their last turn, longest
 * first. Someone who has never taken a turn sorts ahead of everyone. Ties fall
 * back to the preferred names, then to a stable alphabetical order.
 */
export function rankByLongestSince(
  candidates: DonutPerson[],
  lastTurn: LastTurnMap,
): DonutPerson[] {
  return [...candidates].sort((a, b) => {
    const aLast = lastTurn.get(a.id);
    const bLast = lastTurn.get(b.id);
    if (aLast !== bLast) {
      if (!aLast) return -1;
      if (!bLast) return 1;
      return aLast < bLast ? -1 : 1;
    }
    const rank = preferenceRank(a) - preferenceRank(b);
    return rank !== 0 ? rank : a.name.localeCompare(b.name);
  });
}

/** The single best longest-since candidate, or null when there is nobody. */
export function pickLongestSince(
  candidates: DonutPerson[],
  lastTurn: LastTurnMap,
): DonutPerson | null {
  return rankByLongestSince(candidates, lastTurn)[0] ?? null;
}

/** Active people who hold a slot in the base rotation, in rotation order. */
export function rotationRegulars(board: DonutBoard): DonutPerson[] {
  const byId = new Map(board.people.map((person) => [person.id, person]));
  const regulars: DonutPerson[] = [];
  for (const personId of board.rotation) {
    const person = personId ? byId.get(personId) : undefined;
    if (person && person.active && !regulars.includes(person)) {
      regulars.push(person);
    }
  }
  return regulars;
}

/**
 * The stand-in for the `coverIndex`-th time a stood-down regular's slot has
 * come round. Cycling by index (rather than by longest-since) is what keeps
 * the load spread instead of parking it on one person every month.
 */
export function pickStandIn(
  board: DonutBoard,
  absentPersonId: string,
  coverIndex: number,
): DonutPerson | null {
  const pool = rotationRegulars(board).filter((person) => person.id !== absentPersonId);
  if (pool.length === 0) {
    return null;
  }
  return pool[coverIndex % pool.length];
}

/** Everyone currently able to bring donuts, regulars and occasional helpers alike. */
export function activePeople(board: DonutBoard): DonutPerson[] {
  return board.people.filter((person) => person.active);
}
