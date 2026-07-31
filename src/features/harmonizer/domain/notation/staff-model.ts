/**
 * The whole measure, assembled: two staves, four voices, and the furniture that
 * frames them.
 *
 * This is the single seam between the workbench's notes and anything that draws
 * them. It is pure and fully serializable — no pixels, no elements — so the
 * layout can be reasoned about in tests and a different renderer could consume
 * the same model unchanged.
 *
 * Eighths and sixteenths are flagged individually rather than beamed. In the
 * seven-shape books a beam groups a melisma, and with one syllable to a note
 * that grouping would say something untrue; beaming can be added later as
 * spans over these symbols without disturbing anything here.
 *
 * (4/4 assumption — see the meter ledger in domain/timing.ts: barlines fall
 * every UNITS_PER_MEASURE and the time signature is fixed.)
 */

import type { SATBVoicing, TonalContext, VoiceId } from '../music-types';
import { TIME_SIGNATURE_LABEL, UNITS_PER_MEASURE } from '../timing';
import { collidingSymbolIds } from './collision';
import { keySigMarks } from './key-signature';
import { voiceSymbols } from './note-symbols';
import { STAVE_OF_VOICE } from './staff-position';
import type { NoteSymbol, StaffModel, StaffStave, StaveId } from './staff-types';

/** Upper voice first on each stave, so a stave's symbols read top line down. */
const VOICES_BY_STAVE: Record<StaveId, VoiceId[]> = {
  treble: ['soprano', 'alto'],
  bass: ['tenor', 'bass'],
};

const STAVE_ORDER: StaveId[] = ['treble', 'bass'];

/** Bars start every measure; over-long legacy content simply gets more of them. */
function barlineUnits(gridUnits: number): number[] {
  const units: number[] = [];
  for (let unit = 0; unit < gridUnits; unit += UNITS_PER_MEASURE) units.push(unit);
  return units;
}

function shiftColliding(notes: NoteSymbol[]): NoteSymbol[] {
  const shifted = collidingSymbolIds(notes);
  if (shifted.size === 0) return notes;
  return notes.map((note) =>
    shifted.has(note.id) ? { ...note, offsetHead: true } : note,
  );
}

function buildStave(
  stave: StaveId,
  voicing: SATBVoicing,
  context: TonalContext,
  gridUnits: number,
): StaffStave {
  const notes: NoteSymbol[] = [];
  const rests: StaffStave['rests'] = [];
  for (const voice of VOICES_BY_STAVE[stave]) {
    const symbols = voiceSymbols(voicing[voice], voice, context, gridUnits);
    notes.push(...symbols.notes);
    rests.push(...symbols.rests);
  }
  return {
    stave,
    keySignature: keySigMarks(context, stave),
    notes: shiftColliding(notes),
    rests,
  };
}

/**
 * The measure as drawable symbols. `gridUnits` is the editor's own width, so the
 * staff spans exactly what the lanes span and every x lines up with the chord
 * row beneath it.
 */
export function buildStaffModel(
  voicing: SATBVoicing,
  context: TonalContext,
  gridUnits: number,
): StaffModel {
  return {
    gridUnits,
    timeSignature: TIME_SIGNATURE_LABEL,
    barlineUnits: barlineUnits(gridUnits),
    staves: STAVE_ORDER.map((stave) => buildStave(stave, voicing, context, gridUnits)),
  };
}

/** Which stave a voice is drawn on — re-exported so callers need one import. */
export { STAVE_OF_VOICE };
