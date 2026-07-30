import { describe, expect, it } from 'vitest';
import { listFixtures } from '../fixtures/registry';
import { keySignatureLabel, listKeyContexts, listMajorKeyContexts, listMinorKeyContexts } from './keys';
import type { TonalContext } from './music-types';
import { toPcName } from './pitch';

function spelledKey(context: TonalContext): string {
  return `${context.tonic.letter}${context.tonic.accidental}:${context.mode}`;
}

describe('keys', () => {
  it('offers 12 majors and 12 minors, all distinct', () => {
    const majors = listMajorKeyContexts();
    const minors = listMinorKeyContexts();
    expect(majors).toHaveLength(12);
    expect(minors).toHaveLength(12);
    expect(new Set(listKeyContexts().map(spelledKey)).size).toBe(24);
    for (const context of majors) expect(context.mode).toBe('major');
    for (const context of minors) {
      expect(context.mode).toBe('natural_minor');
      expect(context.minorDoSystem).toBe('la_based');
    }
  });

  it('prefers flat spellings for majors and relative-pair spellings for minors', () => {
    const majorNames = listMajorKeyContexts().map((context) => toPcName(context.tonic));
    expect(majorNames).toContain('Db');
    expect(majorNames).toContain('Gb');
    expect(majorNames).not.toContain('C#');
    const minorNames = listMinorKeyContexts().map((context) => toPcName(context.tonic));
    expect(minorNames).toContain('G#');
    expect(minorNames).toContain('Eb');
    expect(minorNames).not.toContain('Ab'); // G#m, the relative of B major
  });

  it('pairs every minor with an offered relative major (shared pitch-class set)', () => {
    const majorPcs = new Set(listMajorKeyContexts().map((context) => context.tonicPitchClass));
    for (const minor of listMinorKeyContexts()) {
      // Relative major sits a minor third above the la-based tonic.
      expect(majorPcs.has((minor.tonicPitchClass + 3) % 12)).toBe(true);
    }
  });

  it('labels key signatures in beginner language', () => {
    const byName = (name: string, mode: 'major' | 'minor') =>
      (mode === 'major' ? listMajorKeyContexts() : listMinorKeyContexts()).find(
        (context) => toPcName(context.tonic) === name,
      )!;
    expect(keySignatureLabel(byName('C', 'major'))).toBe('no sharps or flats');
    expect(keySignatureLabel(byName('Eb', 'major'))).toBe('3 flats · B♭ E♭ A♭');
    expect(keySignatureLabel(byName('A', 'major'))).toBe('3 sharps · F♯ C♯ G♯');
    expect(keySignatureLabel(byName('F', 'major'))).toBe('1 flat · B♭');
    expect(keySignatureLabel(byName('F#', 'minor'))).toBe('3 sharps · F♯ C♯ G♯');
  });

  it('covers every fixture context, so Samples always load into a selectable key', () => {
    const offered = new Set(listKeyContexts().map(spelledKey));
    for (const fixture of listFixtures()) {
      expect(offered.has(spelledKey(fixture.initialState.tonalContext))).toBe(true);
    }
  });
});
