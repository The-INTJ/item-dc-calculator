/**
 * Where local games live: this browser's localStorage, one key per game.
 * A game saved by an earlier version of Tracer is upcast on read; every read
 * is then schema-checked, so hand-edited or unreadable storage reads as
 * missing rather than breaking.
 * Storage can be unavailable (private windows, blocked site data); writes
 * then report failure and the caller keeps playing in memory.
 */

import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { StyleRefSchema } from '../storage/gameDocument';
import { GameStateSchema, TurnRecordSchema } from '../storage/stateSchema';
import { upcastLocalRecord } from '../storage/upcast';
import { LOCAL_GAME_ID, type LocalGameRecord } from './localGame';

const KEY_PREFIX = 'tracer:local:';
const CHANGE_EVENT = 'tracer:local-game';

const RecordSchema = z.object({
  id: z.string().regex(LOCAL_GAME_ID),
  createdAt: z.number(),
  updatedAt: z.number(),
  style: StyleRefSchema,
  state: GameStateSchema,
  turns: z.array(TurnRecordSchema),
});

export function newLocalGameId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `local-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`;
}

function readRaw(id: string): string | null {
  try {
    return window.localStorage.getItem(KEY_PREFIX + id);
  } catch {
    return null;
  }
}

function parse(raw: string | null): LocalGameRecord | null {
  if (!raw) return null;
  try {
    const parsed = RecordSchema.safeParse(upcastLocalRecord(JSON.parse(raw)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function loadLocalGame(id: string): LocalGameRecord | null {
  return LOCAL_GAME_ID.test(id) ? parse(readRaw(id)) : null;
}

export function saveLocalGame(record: LocalGameRecord): boolean {
  try {
    window.localStorage.setItem(KEY_PREFIX + record.id, JSON.stringify(record));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

const cache = new Map<string, { raw: string | null; record: LocalGameRecord | null }>();

function snapshot(id: string): LocalGameRecord | null {
  const raw = LOCAL_GAME_ID.test(id) ? readRaw(id) : null;
  const cached = cache.get(id);
  if (cached && cached.raw === raw) return cached.record;
  const record = parse(raw);
  cache.set(id, { raw, record });
  return record;
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** The saved game, live across tabs. `undefined` until the browser has read it. */
export function useLocalGameRecord(id: string): LocalGameRecord | null | undefined {
  return useSyncExternalStore(subscribe, () => snapshot(id), () => undefined);
}
