/**
 * Keeping two voices on one stave legible.
 *
 * Soprano and alto share the treble stave, tenor and bass the bass stave. When
 * both voices strike at the same moment on the same or an adjacent step, one
 * notehead has to step aside or the pair reads as a single note. The lower voice
 * moves, which is the usual engraving choice and keeps the upper line — the one
 * a singer is following — where the eye expects it.
 *
 * A printed hymnal would go further and merge a unison into ONE notehead with a
 * stem rising and falling from it. We deliberately do not (Drew, 2026-07-31):
 * this staff is an editing surface, and a merged head gives you nothing to grab
 * to pull the two voices apart again. Two heads side by side stay separable, and
 * they still say plainly that two voices are here. Do not "fix" this into a
 * merge without solving that first.
 */

import { STEM_DIRECTION_OF_VOICE } from './staff-position';
import type { NoteSymbol } from './staff-types';

/** A second or a unison: close enough that two heads would touch or merge. */
const CLOSE_STEPS = 1;

/**
 * Ids of the noteheads that must shift right by one head. Only heads that begin
 * together can collide — a note already sounding sits further left, so it is
 * never in the way.
 */
export function collidingSymbolIds(notes: NoteSymbol[]): Set<string> {
  const byOnset = new Map<number, NoteSymbol[]>();
  for (const note of notes) {
    const group = byOnset.get(note.startUnit);
    if (group) group.push(note);
    else byOnset.set(note.startUnit, [note]);
  }

  const shifted = new Set<string>();
  for (const group of byOnset.values()) {
    for (const note of group) {
      for (const other of group) {
        if (note.voice === other.voice) continue;
        if (Math.abs(note.step - other.step) > CLOSE_STEPS) continue;
        const lower = STEM_DIRECTION_OF_VOICE[note.voice] === 'down' ? note : other;
        shifted.add(lower.id);
      }
    }
  }
  return shifted;
}
