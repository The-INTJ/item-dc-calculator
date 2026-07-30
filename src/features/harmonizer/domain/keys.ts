/**
 * The generated key list — every key the workbench offers, independent of
 * what any fixture happens to use. Spelling policy: flat-preferred majors
 * (Db not C#, Gb not F# — gospel/hymnal convention, where flat keys
 * dominate), and each minor is the RELATIVE of an offered major, so la-based
 * minor shares its syllable set and key signature with a selectable major
 * (this also lands on the conventional minor spellings: G#m not Abm).
 */

import { keyInfo } from './engine/tonal-bridge';
import type { TonalContext } from './music-types';
import { parsePitchClass } from './pitch';

const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const MINOR_TONICS = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#'] as const;

function majorContext(tonic: string): TonalContext {
  const spelled = parsePitchClass(tonic);
  return {
    tonic: spelled,
    tonicPitchClass: spelled.pitchClass,
    mode: 'major',
    solfegeSystem: 'movable_do',
  };
}

function minorContext(tonic: string): TonalContext {
  const spelled = parsePitchClass(tonic);
  return {
    tonic: spelled,
    tonicPitchClass: spelled.pitchClass,
    mode: 'natural_minor',
    minorDoSystem: 'la_based',
    solfegeSystem: 'movable_do',
  };
}

const MAJORS: readonly TonalContext[] = MAJOR_TONICS.map(majorContext);
const MINORS: readonly TonalContext[] = MINOR_TONICS.map(minorContext);

export function listMajorKeyContexts(): readonly TonalContext[] {
  return MAJORS;
}

export function listMinorKeyContexts(): readonly TonalContext[] {
  return MINORS;
}

/** All 24 offered keys, majors first (chromatic from C), then minors (from A). */
export function listKeyContexts(): TonalContext[] {
  return [...MAJORS, ...MINORS];
}

/**
 * Beginner-readable key-signature hint, e.g. "3 flats · B♭ E♭ A♭" or
 * "no sharps or flats". Computed, never stored.
 */
export function keySignatureLabel(context: TonalContext): string {
  const info = keyInfo(context);
  if (!info) return '';
  const signature = info.signature ?? '';
  if (signature.length === 0) return 'no sharps or flats';
  const isSharp = signature.startsWith('#');
  const count = signature.length;
  const order = isSharp ? ['F', 'C', 'G', 'D', 'A', 'E', 'B'] : ['B', 'E', 'A', 'D', 'G', 'F', 'C'];
  const glyph = isSharp ? '♯' : '♭';
  const names = order.slice(0, count).map((letter) => `${letter}${glyph}`);
  const word = isSharp ? (count === 1 ? 'sharp' : 'sharps') : count === 1 ? 'flat' : 'flats';
  return `${count} ${word} · ${names.join(' ')}`;
}
