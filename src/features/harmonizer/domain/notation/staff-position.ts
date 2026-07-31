/**
 * Where a voice sits and where a pitch lands.
 *
 * Staff steps count half-spaces downward from a stave's top line (see
 * staff-types.ts). Because steps are diatonic, the arithmetic is letter-name
 * arithmetic: number every letter across the octaves, then measure the distance
 * from the letter sitting on the stave's top line.
 */

import { LETTERS } from '../pitch';
import type { LetterName, VoiceId } from '../music-types';
import type { NotatedBase, StaveId, StemDirection } from './staff-types';

/** Soprano and alto share the treble stave; tenor and bass share the bass stave. */
export const STAVE_OF_VOICE: Record<VoiceId, StaveId> = {
  soprano: 'treble',
  alto: 'treble',
  tenor: 'bass',
  bass: 'bass',
};

/**
 * Stems are fixed per voice rather than by staff position, so two voices sharing
 * a stave stay readable as two lines: the upper voice stems up, the lower down.
 */
export const STEM_DIRECTION_OF_VOICE: Record<VoiceId, StemDirection> = {
  soprano: 'up',
  alto: 'down',
  tenor: 'up',
  bass: 'down',
};

/** A letter's position in an endless diatonic ladder, counting C as the octave's floor. */
function diatonicIndex(letter: LetterName, octave: number): number {
  return octave * LETTERS.length + LETTERS.indexOf(letter);
}

/** F5 sits on the treble stave's top line; A3 sits on the bass stave's top line. */
const TOP_LINE_INDEX: Record<StaveId, number> = {
  treble: diatonicIndex('F', 5),
  bass: diatonicIndex('A', 3),
};

/**
 * The staff step for a written pitch: 0 on the stave's top line, growing
 * downward, negative above. Accidentals are ignored on purpose — F and F sharp
 * share a step, which is exactly why an accidental sits beside a note instead of
 * moving it.
 */
export function staffStepFor(letter: LetterName, octave: number, stave: StaveId): number {
  return TOP_LINE_INDEX[stave] - diatonicIndex(letter, octave);
}

/** Steps a stave's five lines occupy: top line 0 down to bottom line 8. */
export const STAFF_LINE_STEPS: number[] = [0, 2, 4, 6, 8];

const TOP_LINE_STEP = STAFF_LINE_STEPS[0];
const BOTTOM_LINE_STEP = STAFF_LINE_STEPS[STAFF_LINE_STEPS.length - 1];

/**
 * The short lines a note needs to be readable outside the stave. A note in the
 * first space beyond the stave needs none; past that, every line between the
 * stave and the note gets drawn.
 */
export function ledgerStepsFor(step: number): number[] {
  const steps: number[] = [];
  for (let above = TOP_LINE_STEP - 2; above >= step; above -= 2) steps.push(above);
  for (let below = BOTTOM_LINE_STEP + 2; below <= step; below += 2) steps.push(below);
  return steps;
}

/** Where a rest sits when a stave carries only one voice. */
const REST_STEP: Record<NotatedBase, number> = { w: 2, h: 4, q: 4, e: 4, s: 4 };

/** Two voices share a stave, so each keeps its rests a space clear of the other. */
const VOICE_REST_SHIFT = 2;

/**
 * Where a rest hangs. The whole rest drops from the line above the middle and
 * the half rest sits on top of it — the two are the same little rectangle, and
 * only that placement tells them apart. Everything shorter centres on the stave.
 *
 * The voice matters because two of them share every stave. A rest left in the
 * middle would sit exactly where the other voice is singing, so the upper voice
 * lifts its rests and the lower voice drops them — the same reasoning that
 * fixes each voice's stems in one direction.
 */
export function restStepFor(base: NotatedBase, voice: VoiceId): number {
  const up = STEM_DIRECTION_OF_VOICE[voice] === 'up';
  return REST_STEP[base] + (up ? -VOICE_REST_SHIFT : VOICE_REST_SHIFT);
}

/**
 * Which way a tie bulges. It follows the stem so the arc stays clear of it,
 * which also keeps the two voices on a stave from tangling.
 */
export function tieSideForVoice(voice: VoiceId): 'over' | 'under' {
  return STEM_DIRECTION_OF_VOICE[voice] === 'up' ? 'under' : 'over';
}
