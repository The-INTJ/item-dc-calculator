/**
 * The vocabulary the staff view is drawn in.
 *
 * Two coordinate ideas run through every notation module. Horizontally the
 * staff shares the workbench's sixteenth grid, so x stays in timeline units and
 * nothing here needs to know about it. Vertically a note's home is a STAFF STEP:
 * whole numbers counting half-spaces DOWNWARD from a stave's top line, so step 0
 * is the top line, step 1 the space beneath it, step 8 the bottom line, and
 * negatives sit above the stave. Steps are diatonic — they follow letter names,
 * which is why an accidental never moves a notehead.
 */

import type { Accidental, LetterName, VoiceId } from '../music-types';

/** Voices pair off onto two staves: soprano and alto above, tenor and bass below. */
export type StaveId = 'treble' | 'bass';

export type StemDirection = 'up' | 'down';

/**
 * The seven Aikin shapes, named for their outlines rather than their syllables —
 * a shape belongs to a scale degree, and which syllable that degree carries
 * depends on the mode (in la-based minor, degree 1 is la and takes the square).
 *
 * `triangleSide` is fa, the one shape whose orientation is not fixed: its
 * upright edge always sits on the stem side, so it mirrors with the stem.
 */
export type ShapeId =
  | 'triangleUp'
  | 'moon'
  | 'diamond'
  | 'triangleSide'
  | 'round'
  | 'square'
  | 'triangleRound';

/**
 * An undotted written note value. Same five codes domain/signatures.ts uses for
 * fixture fingerprints — whole, half, quarter, eighth, sixteenth. Dots and ties
 * are carried alongside a base value, never folded into it.
 */
export type NotatedBase = 'w' | 'h' | 'q' | 'e' | 's';

/**
 * One written note. A single edited span can need several of these: the grid
 * lets a note be any number of sixteenths, but only some lengths have a symbol,
 * so five sixteenths is written as a quarter tied to a sixteenth. Positions are
 * absolute on the workbench's sixteenth grid, 0-based.
 */
export interface NotatedValue {
  startUnit: number;
  units: number;
  base: NotatedBase;
  dots: 0 | 1;
  /** Held into the value that follows — the pair reads as one sustained note. */
  tieToNext: boolean;
}

/**
 * One written rest. Rests are never tied and never dotted here: a silence is
 * easier to count when it is spelled out beat by beat.
 */
export interface RestValue {
  startUnit: number;
  units: number;
  base: NotatedBase;
}

/** One accidental in the key signature, in printing order. */
export interface KeySigMark {
  index: number;
  letter: LetterName;
  accidental: Extract<Accidental, '#' | 'b'>;
  step: number;
}

/**
 * One drawn notehead with everything attached to it. A single edited note can
 * produce several of these when its length has to be tied together, which is why
 * `eventId` is kept: the staff draws symbols, but the editor still edits notes.
 */
export interface NoteSymbol {
  id: string;
  eventId: string;
  voice: VoiceId;
  stave: StaveId;
  startUnit: number;
  units: number;
  base: NotatedBase;
  dots: 0 | 1;
  /** The Aikin shape for this degree; null when the mode is unsupported. */
  shape: ShapeId | null;
  step: number;
  stem: StemDirection;
  ledgerSteps: number[];
  /** Printed only where the key signature does not already say it. */
  accidental: Accidental | null;
  /** Nudged clear of a unison or second in the other voice on this stave. */
  offsetHead: boolean;
  tieToNext: boolean;
  tieFromPrevious: boolean;
}

export interface RestSymbol {
  id: string;
  voice: VoiceId;
  stave: StaveId;
  startUnit: number;
  units: number;
  base: NotatedBase;
  step: number;
}

/** One stave of the system: its signature and the two voices sharing it. */
export interface StaffStave {
  stave: StaveId;
  keySignature: KeySigMark[];
  notes: NoteSymbol[];
  rests: RestSymbol[];
}

/**
 * Everything needed to draw the measure, and nothing about how. Positions are in
 * grid units and staff steps, so the same model draws at any size.
 */
export interface StaffModel {
  gridUnits: number;
  timeSignature: string;
  /** Where bars begin, in grid units — more than one only for over-long content. */
  barlineUnits: number[];
  staves: StaffStave[];
}
