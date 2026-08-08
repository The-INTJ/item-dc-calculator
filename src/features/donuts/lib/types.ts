/**
 * Core data model for the Sunday-morning donut rotation.
 *
 * The whole board lives in one Firestore document: the people, the base
 * ordinal-Sunday rotation, any per-date overrides, and an append-only log.
 * Every schedule question ("who has this Sunday?") is *derived* from those
 * four things by `schedule.ts` rather than stored, so the board stays small
 * and history can never drift out of sync with the rules.
 */

/** Calendar date in `YYYY-MM-DD` form, always interpreted as a wall date. */
export type IsoDate = string;

/** Ordinal Sunday of a month: 1st through 5th. */
export type SundayOrdinal = 1 | 2 | 3 | 4 | 5;

export interface DonutPerson {
  id: string;
  name: string;
  /** False while someone is stood down (e.g. a newborn at home). */
  active: boolean;
  /** Epoch milliseconds when the person was added. */
  createdAt: number;
}

/**
 * A one-off assignment for a single date. Overrides beat the base rotation
 * outright, and are also how a swap ("I cannot do it" / "I can do it") is
 * persisted, so the record of who actually brought donuts is one concept.
 */
export interface DonutOverride {
  id: string;
  date: IsoDate;
  personId: string;
  note?: string;
  createdAt: number;
}

export type DonutLogKind = 'override' | 'declined' | 'volunteered' | 'cleared';

/** Append-only audit trail shown on the main page and in admin. */
export interface DonutLogEntry {
  id: string;
  /** Epoch milliseconds when the entry was recorded. */
  at: number;
  /** The Sunday the entry is about. */
  date: IsoDate;
  kind: DonutLogKind;
  /** Who ended up holding the date after this entry. */
  personName: string;
  /** Who held the date before this entry, when it was a swap. */
  previousName?: string;
  /** Optional free-text reason supplied when declining. */
  reason?: string;
}

export interface DonutBoard {
  people: DonutPerson[];
  /**
   * Base rotation indexed by ordinal Sunday: `rotation[0]` is the 1st Sunday.
   * Always length 5; a `null` slot means nobody is assigned by default.
   */
  rotation: (string | null)[];
  overrides: DonutOverride[];
  log: DonutLogEntry[];
  /**
   * The Sunday the derived history starts from. Simulating forward from a
   * fixed anchor is what makes "longest since a turn" and the rotating
   * stand-in deterministic — it must not change once the board exists.
   */
  anchorDate: IsoDate;
  updatedAt: number;
}

/** Why a resolved Sunday landed on the person it did. */
export type AssignmentSource =
  | 'override'
  | 'rotation'
  | 'cover'
  | 'fill'
  | 'unassigned';

/** A single Sunday after the base rotation, overrides and covers are applied. */
export interface ResolvedSunday {
  date: IsoDate;
  ordinal: SundayOrdinal;
  personId: string | null;
  personName: string;
  source: AssignmentSource;
  /** Set on `cover` — the inactive regular whose slot is being covered. */
  coveringForName?: string;
  /** Set on `override` — the note captured with the override. */
  note?: string;
}

/** Standard result envelope shared by the store and API client. */
export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
