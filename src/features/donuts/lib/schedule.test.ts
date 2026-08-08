import { describe, expect, it } from 'vitest';

import { pickReplacementFor, resolveSundayOn, simulate } from './schedule';
import type { DonutBoard, DonutPerson } from './types';

function person(id: string, name: string, active = true): DonutPerson {
  return { id, name, active, createdAt: 0 };
}

/** Mirrors the seeded roster: Matthew stood down, Will outside the rotation. */
function board(overrides: Partial<DonutBoard> = {}): DonutBoard {
  return {
    people: [
      person('drew', 'Drew'),
      person('matthew', 'Matthew', false),
      person('alex', 'Alex'),
      person('josh', 'Josh'),
      person('caleb', 'Caleb'),
      person('will', 'Will Brantley'),
    ],
    rotation: ['drew', 'matthew', 'alex', 'josh', 'caleb'],
    overrides: [],
    log: [],
    anchorDate: '2026-06-07',
    updatedAt: 0,
    ...overrides,
  };
}

describe('base rotation', () => {
  it('assigns by ordinal Sunday of the month', () => {
    const days = simulate(board(), '2026-08-30').sundays.filter((d) =>
      d.date.startsWith('2026-08'),
    );
    expect(days.map((d) => [d.date, d.personName])).toEqual([
      ['2026-08-02', 'Drew'],
      ['2026-08-09', 'Josh'], // Matthew's slot, covered — 3rd cover since the anchor
      ['2026-08-16', 'Alex'],
      ['2026-08-23', 'Josh'],
      ['2026-08-30', 'Caleb'], // the 5th Sunday
    ]);
  });

  it('skips the 5th slot in months with only four Sundays', () => {
    const days = simulate(board(), '2027-02-28').sundays.filter((d) =>
      d.date.startsWith('2027-02'),
    );
    expect(days).toHaveLength(4);
    expect(days.map((d) => d.ordinal)).toEqual([1, 2, 3, 4]);
  });
});

describe('covering a stood-down regular', () => {
  it('rotates the stand-in instead of parking it on one person', () => {
    const covers = simulate(board(), '2026-12-31').sundays.filter(
      (day) => day.source === 'cover',
    );
    const names = covers.map((day) => day.personName);
    expect(names.length).toBeGreaterThanOrEqual(6);
    // Drew, Alex, Josh, Caleb in turn — the pool cycles rather than repeats.
    expect(names.slice(0, 5)).toEqual(['Drew', 'Alex', 'Josh', 'Caleb', 'Drew']);
    expect(covers.every((day) => day.coveringForName === 'Matthew')).toBe(true);
  });

  it('keeps Will out of the automatic cover pool — he is not a regular', () => {
    const covers = simulate(board(), '2027-06-30').sundays.filter(
      (day) => day.source === 'cover',
    );
    expect(covers.some((day) => day.personName === 'Will Brantley')).toBe(false);
  });

  it('hands the slot straight back when Matthew is reactivated', () => {
    const reactivated = board({
      people: board().people.map((p) => (p.id === 'matthew' ? { ...p, active: true } : p)),
    });
    expect(resolveSundayOn(reactivated, '2026-08-09')).toMatchObject({
      personName: 'Matthew',
      source: 'rotation',
    });
  });
});

describe('per-date overrides', () => {
  const withWill = board({
    overrides: [
      { id: 'o1', date: '2026-08-09', personId: 'will', createdAt: 1, note: 'Will has it' },
    ],
  });

  it('beats the base rotation and the cover rule', () => {
    expect(resolveSundayOn(withWill, '2026-08-09')).toMatchObject({
      personName: 'Will Brantley',
      source: 'override',
      note: 'Will has it',
    });
  });

  it('does not shift any other date', () => {
    expect(resolveSundayOn(withWill, '2026-08-16').personName).toBe('Alex');
    expect(resolveSundayOn(withWill, '2026-08-23').personName).toBe('Josh');
  });

  it('does not consume a cover turn — the stand-in order just slides later', () => {
    const names = (b: DonutBoard) =>
      simulate(b, '2026-10-31')
        .sundays.filter((d) => d.source === 'cover')
        .map((d) => d.personName);
    const plain = names(board());
    const shifted = names(withWill);
    expect(shifted).toHaveLength(plain.length - 1);
    expect(shifted).toEqual(plain.slice(0, shifted.length));
  });

  it('lets the later override win when a date is claimed twice', () => {
    const claimedTwice = board({
      overrides: [
        { id: 'o1', date: '2026-08-16', personId: 'will', createdAt: 1 },
        { id: 'o2', date: '2026-08-16', personId: 'caleb', createdAt: 2 },
      ],
    });
    expect(resolveSundayOn(claimedTwice, '2026-08-16').personName).toBe('Caleb');
  });
});

describe('pickReplacementFor', () => {
  it('picks whoever has gone longest without a turn', () => {
    const { current, replacement } = pickReplacementFor(board(), '2026-08-16');
    expect(current.personName).toBe('Alex');
    // Neither Caleb nor Will has taken a turn yet; Caleb is the preferred default.
    expect(replacement?.name).toBe('Caleb');
  });

  it('falls to Will once Caleb has had a recent turn', () => {
    const calebServed = board({
      overrides: [{ id: 'o1', date: '2026-08-09', personId: 'caleb', createdAt: 1 }],
    });
    expect(pickReplacementFor(calebServed, '2026-08-16').replacement?.name).toBe(
      'Will Brantley',
    );
  });

  it('never hands the date back to the person stepping aside', () => {
    const { replacement } = pickReplacementFor(board(), '2026-08-16');
    expect(replacement?.id).not.toBe('alex');
  });

  it('skips inactive people', () => {
    const everyoneServed = board({
      overrides: [{ id: 'o1', date: '2026-08-02', personId: 'will', createdAt: 1 }],
    });
    const { replacement } = pickReplacementFor(everyoneServed, '2026-08-16');
    expect(replacement?.active).toBe(true);
    expect(replacement?.id).not.toBe('matthew');
  });

  it('prefers Caleb when candidates are otherwise tied on an empty history', () => {
    const fresh = board({ anchorDate: '2026-08-16' });
    const { replacement } = pickReplacementFor(fresh, '2026-08-16');
    expect(replacement?.name).toBe('Caleb');
  });
});
