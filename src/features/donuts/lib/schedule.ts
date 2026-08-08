/**
 * Turns a board into a concrete schedule.
 *
 * The schedule is simulated forward, one Sunday at a time, from the board's
 * anchor date. Walking history in order is what lets the later rules depend on
 * the earlier ones — "who has gone longest without a turn" and "whose turn is
 * it to cover" both need to know what already happened — without ever storing
 * a derived assignment that could drift from the rules.
 */

import { ordinalSundayOfMonth, sundaysThrough } from './sundays';
import {
  activePeople,
  pickLongestSince,
  pickStandIn,
  type LastTurnMap,
} from './substitution';

import type { DonutBoard, DonutPerson, IsoDate, ResolvedSunday } from './types';

export interface Simulation {
  sundays: ResolvedSunday[];
  /** Last Sunday each person took, across the whole simulated range. */
  lastTurn: LastTurnMap;
}

interface SimulationState {
  lastTurn: LastTurnMap;
  /** How many times each stood-down person's slot has already been covered. */
  coverCounts: Map<string, number>;
}

const UNASSIGNED = 'Nobody yet';

function overrideFor(board: DonutBoard, date: IsoDate) {
  // Later overrides win, so an admin edit supersedes an earlier swap.
  return [...board.overrides]
    .filter((entry) => entry.date === date)
    .sort((a, b) => a.createdAt - b.createdAt)
    .at(-1);
}

function resolveOne(
  board: DonutBoard,
  byId: Map<string, DonutPerson>,
  date: IsoDate,
  state: SimulationState,
): ResolvedSunday {
  const ordinal = ordinalSundayOfMonth(date);
  const base: Omit<ResolvedSunday, 'personId' | 'personName' | 'source'> = { date, ordinal };

  const override = overrideFor(board, date);
  const overridden = override ? byId.get(override.personId) : undefined;
  if (overridden) {
    return {
      ...base,
      personId: overridden.id,
      personName: overridden.name,
      source: 'override',
      note: override?.note,
    };
  }

  const scheduledId = board.rotation[ordinal - 1] ?? null;
  const scheduled = scheduledId ? byId.get(scheduledId) : undefined;

  if (scheduled?.active) {
    return { ...base, personId: scheduled.id, personName: scheduled.name, source: 'rotation' };
  }

  if (scheduled) {
    const coverIndex = state.coverCounts.get(scheduled.id) ?? 0;
    const standIn = pickStandIn(board, scheduled.id, coverIndex);
    state.coverCounts.set(scheduled.id, coverIndex + 1);
    if (standIn) {
      return {
        ...base,
        personId: standIn.id,
        personName: standIn.name,
        source: 'cover',
        coveringForName: scheduled.name,
      };
    }
  }

  const filler = pickLongestSince(activePeople(board), state.lastTurn);
  if (filler) {
    return { ...base, personId: filler.id, personName: filler.name, source: 'fill' };
  }

  return { ...base, personId: null, personName: UNASSIGNED, source: 'unassigned' };
}

/** Resolve every Sunday from the board's anchor through `throughDate`. */
export function simulate(board: DonutBoard, throughDate: IsoDate): Simulation {
  const byId = new Map(board.people.map((person) => [person.id, person]));
  const state: SimulationState = { lastTurn: new Map(), coverCounts: new Map() };
  const sundays: ResolvedSunday[] = [];

  for (const date of sundaysThrough(board.anchorDate, throughDate)) {
    const resolved = resolveOne(board, byId, date, state);
    sundays.push(resolved);
    if (resolved.personId) {
      state.lastTurn.set(resolved.personId, date);
    }
  }

  return { sundays, lastTurn: state.lastTurn };
}

/** Resolve a single Sunday, simulating whatever history it depends on. */
export function resolveSundayOn(board: DonutBoard, date: IsoDate): ResolvedSunday {
  const { sundays } = simulate(board, date);
  const match = sundays.at(-1);
  if (match?.date === date) {
    return match;
  }
  // `date` predates the anchor — no derived history applies to it.
  return {
    date,
    ordinal: ordinalSundayOfMonth(date),
    personId: null,
    personName: UNASSIGNED,
    source: 'unassigned',
  };
}

/**
 * Who should take over a date from its current assignee: the active person who
 * has gone longest without a turn, ignoring the person stepping aside.
 */
export function pickReplacementFor(
  board: DonutBoard,
  date: IsoDate,
): { current: ResolvedSunday; replacement: DonutPerson | null } {
  const { sundays, lastTurn } = simulate(board, date);
  const last = sundays.at(-1);
  const current = last?.date === date ? last : resolveSundayOn(board, date);

  // The person stepping aside is excluded outright, so their own entry in
  // `lastTurn` — which includes this very date — is never consulted.
  const candidates = activePeople(board).filter((person) => person.id !== current.personId);
  return { current, replacement: pickLongestSince(candidates, lastTurn) };
}
