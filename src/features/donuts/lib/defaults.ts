/**
 * The board the group starts from, created on first read so nobody has to seed
 * anything by hand. Ids are readable slugs rather than random strings because
 * these six are the founding roster and show up in every debugging session.
 */

import { addWeeks, todayIso, upcomingSunday } from './sundays';
import type { DonutBoard, DonutPerson } from './types';

/** Weeks of derived history to simulate before the board's first real Sunday. */
const ANCHOR_WEEKS_BACK = 12;

interface SeedPerson {
  id: string;
  name: string;
  active: boolean;
}

const SEED_PEOPLE: SeedPerson[] = [
  { id: 'drew', name: 'Drew', active: true },
  // Newborn at home — kept on the board so he can be switched back on later.
  { id: 'matthew', name: 'Matthew', active: false },
  { id: 'alex', name: 'Alex', active: true },
  { id: 'josh', name: 'Josh', active: true },
  { id: 'caleb', name: 'Caleb', active: true },
  // Not in the base rotation; brings donuts occasionally as a one-off.
  { id: 'will-brantley', name: 'Will Brantley', active: true },
];

/** 1st through 5th Sunday of every month. */
const SEED_ROTATION = ['drew', 'matthew', 'alex', 'josh', 'caleb'];

export function createDefaultBoard(now: Date = new Date()): DonutBoard {
  const nextSunday = upcomingSunday(todayIso(now));
  const createdAt = now.getTime();
  const people: DonutPerson[] = SEED_PEOPLE.map((person) => ({ ...person, createdAt }));

  return {
    people,
    rotation: [...SEED_ROTATION],
    overrides: [
      {
        id: 'seed-will-brantley',
        date: nextSunday,
        personId: 'will-brantley',
        note: 'Will volunteered to bring them this week.',
        createdAt,
      },
    ],
    log: [
      {
        id: 'seed-will-brantley-log',
        at: createdAt,
        date: nextSunday,
        kind: 'override',
        personName: 'Will Brantley',
        reason: 'Seeded when the rotation moved off text messages.',
      },
    ],
    anchorDate: addWeeks(nextSunday, -ANCHOR_WEEKS_BACK),
    updatedAt: createdAt,
  };
}
