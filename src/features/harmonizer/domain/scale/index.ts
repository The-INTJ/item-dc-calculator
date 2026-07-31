/**
 * Diatonic scale arithmetic for the supported tonal contexts: major, and
 * natural minor with la-based movable-do — for ALL twelve tonics (the letter
 * arithmetic in diatonicPitch generalizes; only the mode tables gate support).
 * Pure construction — interval tables plus letter/accidental arithmetic from
 * domain/pitch.ts. Unsupported contexts return null; callers treat that as
 * "tool disabled".
 */

export { spellPitch } from '../pitch';
export { solfegeBase, syllableForDegree, type SolfegeBase } from './mode-tables';
export {
  diatonicPitch,
  raisedSeventh,
  raisedSixth,
  spellDegree,
  type DegreeMember,
} from './diatonic-degrees';
export { respellDegree, scaleDegreeForPitchClass } from './degree-reading';
export { stepChromatic } from './chromatic-step';
export { MAX_MIDI, MIN_MIDI, stepDiatonic } from './diatonic-step';
export { tonicWholeNoteFragment } from './tonic-fragment';
