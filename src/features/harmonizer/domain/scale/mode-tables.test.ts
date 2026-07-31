import { describe, expect, it } from 'vitest';
import { listKeyContexts } from '../keys';
import type { TonalContext } from '../music-types';
import { solfegeBase, syllableForDegree } from './mode-tables';

const A_MINOR: TonalContext = {
  tonic: { letter: 'A', accidental: 'natural', pitchClass: 9 },
  tonicPitchClass: 9,
  mode: 'natural_minor',
  minorDoSystem: 'la_based',
  solfegeSystem: 'movable_do',
};

describe('solfegeBase', () => {
  it('counts a major key from do', () => {
    const cMajor = listKeyContexts().find((context) => context.mode === 'major')!;
    expect(solfegeBase(cMajor)).toBe('do_based');
  });

  it('counts a minor key from la', () => {
    expect(solfegeBase(A_MINOR)).toBe('la_based');
  });

  it('has no answer for a mode the workbench does not support', () => {
    expect(solfegeBase({ ...A_MINOR, minorDoSystem: 'do_based' })).toBeNull();
  });

  it('agrees with the syllable the tonic actually carries', () => {
    // The classifier is only meaningful if it matches what degree 1 is called —
    // that identity is what lets a future mode pick its base from its third.
    for (const context of listKeyContexts()) {
      const tonicSyllable = syllableForDegree(context, 1, 0);
      const expected = tonicSyllable === 'la' ? 'la_based' : 'do_based';
      expect(solfegeBase(context), `${context.tonic.letter} ${context.mode}`).toBe(expected);
    }
  });

  it('answers for every key the workbench offers', () => {
    for (const context of listKeyContexts()) {
      expect(solfegeBase(context)).not.toBeNull();
    }
  });
});
