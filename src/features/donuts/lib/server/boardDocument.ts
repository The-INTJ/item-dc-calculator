/**
 * Shape translation between the stored Firestore document and {@link DonutBoard}.
 *
 * Normalisation is defensive on read (a hand-edited document should never crash
 * the page) and strips `undefined` on write, which Firestore rejects outright.
 */

import { createDefaultBoard } from '../defaults';
import { isIsoDate } from '../sundays';
import type {
  DonutBoard,
  DonutLogEntry,
  DonutLogKind,
  DonutOverride,
  DonutPerson,
} from '../types';

const ROTATION_SLOTS = 5;
const LOG_KINDS: DonutLogKind[] = ['override', 'declined', 'volunteered', 'cleared'];

export type BoardDoc = Partial<Record<keyof DonutBoard, unknown>>;

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizePerson(raw: unknown, fallbackTime: number): DonutPerson | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    active: record.active !== false,
    createdAt: asNumber(record.createdAt, fallbackTime),
  };
}

function normalizeOverride(raw: unknown, fallbackTime: number): DonutOverride | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = asString(record.id);
  const date = asString(record.date);
  const personId = asString(record.personId);
  if (!id || !date || !personId || !isIsoDate(date)) return null;
  return {
    id,
    date,
    personId,
    note: asString(record.note),
    createdAt: asNumber(record.createdAt, fallbackTime),
  };
}

function normalizeLogEntry(raw: unknown, fallbackTime: number): DonutLogEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = asString(record.id);
  const date = asString(record.date);
  const personName = asString(record.personName);
  const kind = asString(record.kind) as DonutLogKind | undefined;
  if (!id || !date || !personName || !kind || !LOG_KINDS.includes(kind)) return null;
  return {
    id,
    at: asNumber(record.at, fallbackTime),
    date,
    kind,
    personName,
    previousName: asString(record.previousName),
    reason: asString(record.reason),
  };
}

function normalizeList<T>(raw: unknown, map: (item: unknown) => T | null): T[] {
  return Array.isArray(raw) ? raw.map(map).filter((item): item is T => item !== null) : [];
}

function normalizeRotation(raw: unknown): (string | null)[] {
  const source = Array.isArray(raw) ? raw : [];
  return Array.from({ length: ROTATION_SLOTS }, (_, index) => asString(source[index]) ?? null);
}

/** Read a stored document into a usable board, backfilling anything missing. */
export function toBoard(doc: BoardDoc): DonutBoard {
  const fallback = createDefaultBoard();
  const updatedAt = asNumber(doc.updatedAt, fallback.updatedAt);
  const anchorDate = asString(doc.anchorDate);

  return {
    people: normalizeList(doc.people, (item) => normalizePerson(item, updatedAt)),
    rotation: normalizeRotation(doc.rotation),
    overrides: normalizeList(doc.overrides, (item) => normalizeOverride(item, updatedAt)),
    log: normalizeList(doc.log, (item) => normalizeLogEntry(item, updatedAt)),
    anchorDate: anchorDate && isIsoDate(anchorDate) ? anchorDate : fallback.anchorDate,
    updatedAt,
  };
}

function compact<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}

/** Serialise a board for Firestore, dropping the `undefined`s it rejects. */
export function toDoc(board: DonutBoard): Record<string, unknown> {
  return {
    people: board.people.map(compact),
    rotation: board.rotation,
    overrides: board.overrides.map(compact),
    log: board.log.map(compact),
    anchorDate: board.anchorDate,
    updatedAt: board.updatedAt,
  };
}
