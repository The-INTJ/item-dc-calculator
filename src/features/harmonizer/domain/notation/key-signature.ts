/**
 * The key signature, and which notes still need an accidental beside them.
 *
 * A signature's accidentals sit in a fixed order at fixed heights — the zig-zag
 * every reader recognises — so the tables below are positions, not decisions.
 * The bass stave prints the same pattern a third lower, which is the one number
 * that separates the two clefs here.
 */

import type { Accidental, LetterName, SpelledPitch, TonalContext } from '../music-types';
import { keyInfo } from '../engine/tonal-bridge';
import type { KeySigMark, StaveId } from './staff-types';

/** Sharps are added in this order; flats in the reverse. */
const SHARP_ORDER: LetterName[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER: LetterName[] = [...SHARP_ORDER].reverse();

/** Treble-stave steps for each accidental in order; bass sits a third below. */
const SHARP_STEPS_TREBLE = [0, 3, -1, 2, 5, 1, 4];
const FLAT_STEPS_TREBLE = [4, 1, 5, 2, 6, 3, 7];
const BASS_OFFSET = 2;

/**
 * How the signature spells a letter — the accidental a reader already assumes
 * before any is printed.
 */
function signatureAccidental(signature: string, letter: LetterName): Accidental {
  const count = signature.length;
  if (count === 0) return 'natural';
  const sharps = signature.startsWith('#');
  const order = sharps ? SHARP_ORDER : FLAT_ORDER;
  const affected = order.slice(0, count);
  if (!affected.includes(letter)) return 'natural';
  return sharps ? '#' : 'b';
}

/**
 * The accidentals a stave prints at the start of the line. Empty for C major
 * and A minor, and empty for any context the workbench does not support.
 */
export function keySigMarks(context: TonalContext, stave: StaveId): KeySigMark[] {
  const info = keyInfo(context);
  if (!info || info.signature.length === 0) return [];
  const sharps = info.signature.startsWith('#');
  const order = sharps ? SHARP_ORDER : FLAT_ORDER;
  const steps = sharps ? SHARP_STEPS_TREBLE : FLAT_STEPS_TREBLE;
  const offset = stave === 'bass' ? BASS_OFFSET : 0;
  return order.slice(0, info.signature.length).map((letter, index) => ({
    index,
    letter,
    accidental: sharps ? ('#' as const) : ('b' as const),
    step: steps[index] + offset,
  }));
}

/**
 * The accidental to print beside a note, or null when the signature already
 * says it. A raised leading tone in a minor key is exactly this case: the key
 * has no sharp on that letter, so the note carries one.
 *
 * v1 has no bar memory: a note that needs an accidental prints it every time,
 * rather than once per measure, and no courtesy naturals are added. Within a
 * single measure of four voices this reads correctly — it only becomes
 * over-marked once several measures share a line.
 */
export function printedAccidental(
  pitch: SpelledPitch,
  context: TonalContext,
): Accidental | null {
  const info = keyInfo(context);
  const assumed = info ? signatureAccidental(info.signature, pitch.letter) : 'natural';
  return pitch.accidental === assumed ? null : pitch.accidental;
}
