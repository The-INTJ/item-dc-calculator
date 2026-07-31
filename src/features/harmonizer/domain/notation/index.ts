/**
 * Staff notation: turning the workbench's notes into the marks that draw them.
 *
 * Everything here is pure and renderer-agnostic — it emits shapes, staff steps
 * and written values, never pixels or JSX. The outlines come from Bravura and
 * are embedded as path data, so the staff needs no music font at runtime.
 */

export {
  bravuraGlyphs,
  FONT_UNITS_PER_SPACE,
  type BravuraGlyph,
  type BravuraGlyphId,
} from './bravura-glyphs';
export {
  ACCIDENTAL_GLYPHS,
  AUGMENTATION_DOT,
  CLEF_GLYPHS,
  flagGlyph,
  NOTATED_BASES,
  REST_GLYPHS,
} from './engraving-paths';
export { DIATONIC_DEGREES, headGlyph, isHollow, shapeForDegree } from './shape-glyphs';
export { decomposeNoteSpan, decomposeRestSpan } from './duration-notation';
export { keySigMarks, printedAccidental } from './key-signature';
export { stepUnits } from './length-steps';
export { buildStaffModel } from './staff-model';
export {
  ledgerStepsFor,
  restStepFor,
  STAFF_LINE_STEPS,
  STAVE_OF_VOICE,
  STEM_DIRECTION_OF_VOICE,
  staffStepFor,
  tieSideForVoice,
} from './staff-position';
export type {
  KeySigMark,
  NotatedBase,
  NotatedValue,
  NoteSymbol,
  RestSymbol,
  RestValue,
  ShapeId,
  StaffModel,
  StaffStave,
  StaveId,
  StemDirection,
} from './staff-types';
