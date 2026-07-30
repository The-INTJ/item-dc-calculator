/**
 * The ONLY import site of `tonal` in the feature. tonal is pure math (no
 * AudioContext, no DOM) so a static import is safe in SSR and jsdom — unlike
 * tone/smplr, which stay dynamically imported in the playback service.
 *
 * Trust boundary: tonal is used for enharmonic-correct interval arithmetic and
 * key facts, and as a TEST ORACLE for our own spelling/chord math. It is never
 * the source of numeric truth — every SpelledPitch returned from here has its
 * midi/pitchClass recomputed by domain/pitch.ts.
 */

import { Chord, Interval, Key, Note } from 'tonal';

import type {
  Accidental,
  LetterName,
  SpelledPitch,
  SpelledPitchClass,
  TonalContext,
} from '../music-types';
import { spellPitch, toPcName, toSpn } from '../pitch';

export const TONAL_PROVIDER = { providerId: 'tonal', providerVersion: '6.4.3' } as const;

/** tonal's alt (−2..2) → our accidental enum. */
const ALT_TO_ACCIDENTAL: Record<number, Accidental> = {
  [-2]: 'bb',
  [-1]: 'b',
  0: 'natural',
  1: '#',
  2: 'x',
};

/** Parse SPN ("C#4", "Bb3", "Cx5") via tonal; midi/pc recomputed by our math. */
export function fromSpn(spn: string): SpelledPitch | null {
  const note = Note.get(spn);
  if (note.empty || note.oct === undefined || note.alt === undefined) return null;
  const accidental = ALT_TO_ACCIDENTAL[note.alt];
  if (accidental === undefined) return null;
  return spellPitch(note.letter as LetterName, accidental, note.oct);
}

/** Enharmonic-correct transposition, e.g. ("Bb3", "2m") → Cb4. */
export function transposeSpelled(pitch: SpelledPitch, interval: string): SpelledPitch | null {
  return fromSpn(Note.transpose(toSpn(pitch), interval));
}

/** Spelled interval between two pitches in tonal shorthand ("3M", "5d", "6m"). */
export function spelledInterval(a: SpelledPitch, b: SpelledPitch): string {
  return Interval.distance(toSpn(a), toSpn(b));
}

/**
 * tonal's chord detection over pitch-class names, lowest first (the first note
 * is read as the bass, so inversions come back as slash chords). Used as a
 * cross-check/oracle, never as the production namer.
 */
export function detectChords(
  pitches: SpelledPitchClass[],
  options?: { assumePerfectFifth?: boolean },
): string[] {
  return Chord.detect(pitches.map(toPcName), options);
}

/** Key signature + diatonic scale spellings for a supported context. */
export function keyInfo(
  context: TonalContext,
): { signature: string; scaleSpns: string[] } | null {
  const tonic = toPcName(context.tonic);
  if (context.mode === 'major') {
    const key = Key.majorKey(tonic);
    return { signature: key.keySignature, scaleSpns: [...key.scale] };
  }
  if (context.mode === 'natural_minor') {
    const key = Key.minorKey(tonic);
    return { signature: key.keySignature, scaleSpns: [...key.natural.scale] };
  }
  return null;
}
