/**
 * Writes that change who has a specific Sunday.
 *
 * Every one of them lands as a per-date override plus a log entry, so a swap
 * made from the main page and an assignment made in admin are the same thing
 * to the resolver — there is only one way a date can be claimed.
 */

import 'server-only';

import { newId } from '../ids';
import { pickReplacementFor } from '../schedule';
import type { AssignmentInput, CreateOverrideInput } from '../schemas';
import type {
  DonutBoard,
  DonutLogEntry,
  DonutLogKind,
  DonutOverride,
  IsoDate,
  ProviderResult,
} from '../types';

import { mutateBoard } from './boardAccess';

interface ClaimDetails {
  date: IsoDate;
  personId: string;
  kind: DonutLogKind;
  note?: string;
  reason?: string;
  previousName?: string;
}

/** Replace whatever held `date` with a fresh override, and log the change. */
function claimDate(board: DonutBoard, details: ClaimDetails): DonutBoard {
  const person = board.people.find((entry) => entry.id === details.personId);
  if (!person) {
    throw new Error('Person not found');
  }

  const at = Date.now();
  const override: DonutOverride = {
    id: newId(),
    date: details.date,
    personId: person.id,
    note: details.note,
    createdAt: at,
  };
  const entry: DonutLogEntry = {
    id: newId(),
    at,
    date: details.date,
    kind: details.kind,
    personName: person.name,
    previousName: details.previousName,
    reason: details.reason,
  };

  return {
    ...board,
    overrides: [...board.overrides.filter((item) => item.date !== details.date), override],
    log: [entry, ...board.log],
  };
}

/** Admin: pin a date to a person (Will's occasional weeks land here too). */
export function addOverride(
  input: CreateOverrideInput,
): Promise<ProviderResult<DonutBoard>> {
  return mutateBoard((board) =>
    claimDate(board, {
      date: input.date,
      personId: input.personId,
      kind: 'override',
      note: input.note,
    }),
  );
}

/** Admin: drop an override so the date falls back to the base rotation. */
export function removeOverride(overrideId: string): Promise<ProviderResult<DonutBoard>> {
  return mutateBoard((board) => {
    const target = board.overrides.find((entry) => entry.id === overrideId);
    if (!target) {
      throw new Error('Override not found');
    }
    const person = board.people.find((entry) => entry.id === target.personId);
    const cleared: DonutLogEntry = {
      id: newId(),
      at: Date.now(),
      date: target.date,
      kind: 'cleared',
      personName: person?.name ?? 'Someone',
      reason: 'Override removed; back to the normal rotation.',
    };
    return {
      ...board,
      overrides: board.overrides.filter((entry) => entry.id !== overrideId),
      log: [cleared, ...board.log],
    };
  });
}

/**
 * The two buttons on the main page. `decline` hands the date to whoever has
 * gone longest without a turn; `volunteer` hands it to a named person.
 */
export function applyAssignment(
  input: AssignmentInput,
): Promise<ProviderResult<DonutBoard>> {
  return mutateBoard((board) => {
    if (input.mode === 'volunteer') {
      const current = pickReplacementFor(board, input.date).current;
      return claimDate(board, {
        date: input.date,
        personId: input.personId,
        kind: 'volunteered',
        note: input.note,
        previousName: current.personId ? current.personName : undefined,
      });
    }

    const { current, replacement } = pickReplacementFor(board, input.date);
    if (!replacement) {
      throw new Error('Nobody else is available to take this Sunday');
    }
    return claimDate(board, {
      date: input.date,
      personId: replacement.id,
      kind: 'declined',
      reason: input.reason,
      previousName: current.personId ? current.personName : undefined,
    });
  });
}
