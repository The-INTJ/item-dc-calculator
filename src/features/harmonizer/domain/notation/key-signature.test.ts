import { describe, expect, it } from 'vitest';
import type { TonalContext } from '../music-types';
import { listKeyContexts } from '../keys';
import { spellPitch } from '../pitch';
import { keySigMarks, printedAccidental } from './key-signature';
import type { StaveId } from './staff-types';

function key(letter: string, accidental: string, mode: 'major' | 'natural_minor'): TonalContext {
  const found = listKeyContexts().find(
    (context) =>
      context.mode === mode &&
      context.tonic.letter === letter &&
      context.tonic.accidental === accidental,
  );
  if (!found) throw new Error(`${letter}${accidental} ${mode} is not an offered key`);
  return found;
}

const C_MAJOR = key('C', 'natural', 'major');
const E_FLAT_MAJOR = key('E', 'b', 'major');
const A_MAJOR = key('A', 'natural', 'major');
const A_MINOR = key('A', 'natural', 'natural_minor');

function letters(context: TonalContext, stave: StaveId): string {
  return keySigMarks(context, stave)
    .map((mark) => mark.letter)
    .join('');
}

describe('keySigMarks', () => {
  it('prints nothing for the keys that have no signature', () => {
    expect(keySigMarks(C_MAJOR, 'treble')).toEqual([]);
    expect(keySigMarks(A_MINOR, 'bass')).toEqual([]);
  });

  it('adds flats in order', () => {
    expect(letters(E_FLAT_MAJOR, 'treble')).toBe('BEA');
    expect(keySigMarks(E_FLAT_MAJOR, 'treble').map((m) => m.accidental)).toEqual([
      'b',
      'b',
      'b',
    ]);
  });

  it('adds sharps in order', () => {
    expect(letters(A_MAJOR, 'treble')).toBe('FCG');
    expect(keySigMarks(A_MAJOR, 'treble').map((m) => m.accidental)).toEqual([
      '#',
      '#',
      '#',
    ]);
  });

  it('places the treble zig-zag where readers expect it', () => {
    // Three sharps: F#5 on the top line, C#5 in the third space, G#5 above the stave.
    expect(keySigMarks(A_MAJOR, 'treble').map((m) => m.step)).toEqual([0, 3, -1]);
    // Three flats: Bb4, Eb5, Ab4.
    expect(keySigMarks(E_FLAT_MAJOR, 'treble').map((m) => m.step)).toEqual([4, 1, 5]);
  });

  it('prints the same pattern a third lower on the bass stave', () => {
    for (const key of [A_MAJOR, E_FLAT_MAJOR]) {
      const treble = keySigMarks(key, 'treble').map((m) => m.step);
      const bass = keySigMarks(key, 'bass').map((m) => m.step);
      expect(bass).toEqual(treble.map((step) => step + 2));
    }
  });

  it('keeps every accidental on the stave or within one ledger of it', () => {
    // A signature that wandered far off the stave would be a placement bug.
    for (const context of listKeyContexts()) {
      for (const stave of ['treble', 'bass'] as StaveId[]) {
        for (const mark of keySigMarks(context, stave)) {
          expect(mark.step, `${context.tonic.letter} ${stave}`).toBeGreaterThanOrEqual(-2);
          expect(mark.step, `${context.tonic.letter} ${stave}`).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it('gives every offered key a signature of at most seven accidentals', () => {
    for (const context of listKeyContexts()) {
      const marks = keySigMarks(context, 'treble');
      expect(marks.length, `${context.tonic.letter} ${context.mode}`).toBeLessThanOrEqual(7);
      // Indices run 0..n-1 so a renderer can lay them out left to right.
      expect(marks.map((mark) => mark.index)).toEqual(marks.map((_, index) => index));
    }
  });
});

describe('printedAccidental', () => {
  it('says nothing when the signature already spells the note', () => {
    expect(printedAccidental(spellPitch('B', 'b', 4), E_FLAT_MAJOR)).toBeNull();
    expect(printedAccidental(spellPitch('C', 'natural', 4), C_MAJOR)).toBeNull();
    expect(printedAccidental(spellPitch('F', '#', 4), A_MAJOR)).toBeNull();
  });

  it('prints the accidental when the note departs from the key', () => {
    expect(printedAccidental(spellPitch('F', '#', 4), C_MAJOR)).toBe('#');
    // A raised leading tone in a minor key: la-based minor has no sharp on G,
    // so si carries one every time it appears.
    expect(printedAccidental(spellPitch('G', '#', 3), A_MINOR)).toBe('#');
  });

  it('prints a natural that cancels the signature', () => {
    expect(printedAccidental(spellPitch('B', 'natural', 4), E_FLAT_MAJOR)).toBe(
      'natural',
    );
    expect(printedAccidental(spellPitch('F', 'natural', 4), A_MAJOR)).toBe('natural');
  });
});
