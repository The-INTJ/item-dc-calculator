/**
 * Stepwise chromatic motion — moving a note by one half step, spelled the way
 * a musician would write it.
 *
 * A half step keeps the note's DEGREE reading wherever it can: G# in C major is
 * a raised sol (si), not a flattened la, so the notehead keeps sol's round
 * shape and prints a sharp beside it. Where a pitch could be read either way,
 * the DIRECTION decides — rising notes sharpen, falling notes flatten — which
 * is how a chromatic line is written by hand.
 *
 * Inflections resolve on their own: stepping down from si lands on sol natural
 * rather than on a doubly-lowered la, because the reading is taken fresh from
 * the sounding pitch each time rather than carried along from the note before.
 */

import type {
  Accidental,
  LetterName,
  ScaleDegreePitch,
  SpelledPitch,
  TonalContext,
} from '../music-types';
import { ACCIDENTAL_OFFSETS, LETTER_SEMITONES, spellPitch } from '../pitch';
import { scaleDegreeForPitchClass } from './degree-reading';
import { spellDegree } from './diatonic-degrees';
import { MAX_MIDI, MIN_MIDI } from './diatonic-step';

/**
 * The octave a spelling belongs to, worked back from what it sounds. The letter
 * decides it rather than the pitch: B#3 sounds where C4 does but is written an
 * octave lower, and writing it in octave 4 would put it on the wrong line.
 */
function octaveOf(midi: number, letter: LetterName, accidental: Accidental): number {
  return (midi - LETTER_SEMITONES[letter] - ACCIDENTAL_OFFSETS[accidental]) / 12 - 1;
}

/**
 * Move a note one half step. Returns null when the context is unsupported, the
 * result leaves the singable range, or the reading would need an accidental no
 * one writes — all of which the caller treats as "there is nothing there".
 */
export function stepChromatic(
  context: TonalContext,
  from: { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch },
  direction: 1 | -1,
): { pitch: SpelledPitch; scaleDegree: ScaleDegreePitch } | null {
  const midi = from.pitch.midi + direction;
  if (midi < MIN_MIDI || midi > MAX_MIDI) return null;

  const pitchClass = ((midi % 12) + 12) % 12;
  const scaleDegree = scaleDegreeForPitchClass(
    context,
    pitchClass,
    direction === 1 ? 'raised' : 'lowered',
  );
  if (!scaleDegree) return null;

  const spelled = spellDegree(context, scaleDegree.degree, scaleDegree.chromaticOffset);
  if (!spelled) return null;

  const octave = octaveOf(midi, spelled.letter, spelled.accidental);
  return { pitch: spellPitch(spelled.letter, spelled.accidental, octave), scaleDegree };
}
