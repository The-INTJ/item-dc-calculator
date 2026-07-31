import { describe, expect, it } from 'vitest';
import {
  ledgerStepsFor,
  restStepFor,
  STAFF_LINE_STEPS,
  STAVE_OF_VOICE,
  STEM_DIRECTION_OF_VOICE,
  staffStepFor,
  tieSideForVoice,
} from './staff-position';

describe('staffStepFor', () => {
  it('puts the treble stave‘s five lines on the expected steps', () => {
    // F5 E5 ... E4, top line down to bottom line.
    expect(staffStepFor('F', 5, 'treble')).toBe(0);
    expect(staffStepFor('D', 5, 'treble')).toBe(2);
    expect(staffStepFor('B', 4, 'treble')).toBe(4);
    expect(staffStepFor('G', 4, 'treble')).toBe(6);
    expect(staffStepFor('E', 4, 'treble')).toBe(8);
  });

  it('puts the bass stave‘s five lines on the expected steps', () => {
    expect(staffStepFor('A', 3, 'bass')).toBe(0);
    expect(staffStepFor('F', 3, 'bass')).toBe(2);
    expect(staffStepFor('D', 3, 'bass')).toBe(4);
    expect(staffStepFor('B', 2, 'bass')).toBe(6);
    expect(staffStepFor('G', 2, 'bass')).toBe(8);
  });

  it('lands middle C one ledger outside either stave', () => {
    expect(staffStepFor('C', 4, 'treble')).toBe(10);
    expect(staffStepFor('C', 4, 'bass')).toBe(-2);
  });

  it('ignores the accidental — F and F sharp share a step', () => {
    // staffStepFor takes only letter and octave for exactly this reason: an
    // accidental is printed beside a note, never by moving it.
    expect(staffStepFor('F', 4, 'treble')).toBe(staffStepFor('F', 4, 'treble'));
    expect(staffStepFor('B', 3, 'bass') - staffStepFor('C', 4, 'bass')).toBe(1);
  });

  it('counts downward, so higher pitches take smaller steps', () => {
    expect(staffStepFor('G', 5, 'treble')).toBeLessThan(staffStepFor('C', 4, 'treble'));
    expect(staffStepFor('C', 6, 'treble')).toBeLessThan(0);
  });

  it('spans an octave in seven steps', () => {
    expect(staffStepFor('C', 4, 'treble') - staffStepFor('C', 5, 'treble')).toBe(7);
  });
});

describe('voice placement', () => {
  it('pairs the voices onto two staves', () => {
    expect(STAVE_OF_VOICE).toEqual({
      soprano: 'treble',
      alto: 'treble',
      tenor: 'bass',
      bass: 'bass',
    });
  });

  it('stems the upper voice of each stave up and the lower down', () => {
    expect(STEM_DIRECTION_OF_VOICE).toEqual({
      soprano: 'up',
      alto: 'down',
      tenor: 'up',
      bass: 'down',
    });
  });

  it('lines sit two steps apart', () => {
    expect(STAFF_LINE_STEPS).toEqual([0, 2, 4, 6, 8]);
  });

  it('bulges a tie away from the stem', () => {
    expect(tieSideForVoice('soprano')).toBe('under');
    expect(tieSideForVoice('tenor')).toBe('under');
    expect(tieSideForVoice('alto')).toBe('over');
    expect(tieSideForVoice('bass')).toBe('over');
  });
});

describe('ledgerStepsFor', () => {
  it('draws none for anything on the stave', () => {
    for (let step = 0; step <= 8; step += 1) {
      expect(ledgerStepsFor(step), `step ${step}`).toEqual([]);
    }
  });

  it('draws none for the space just outside the stave', () => {
    expect(ledgerStepsFor(-1)).toEqual([]);
    expect(ledgerStepsFor(9)).toEqual([]);
  });

  it('draws every line between the stave and a note above it', () => {
    expect(ledgerStepsFor(-2)).toEqual([-2]);
    expect(ledgerStepsFor(-3)).toEqual([-2]);
    expect(ledgerStepsFor(-4)).toEqual([-2, -4]);
    expect(ledgerStepsFor(-6)).toEqual([-2, -4, -6]);
  });

  it('draws every line between the stave and a note below it', () => {
    // Middle C sits one ledger below the treble stave.
    expect(ledgerStepsFor(10)).toEqual([10]);
    expect(ledgerStepsFor(11)).toEqual([10]);
    expect(ledgerStepsFor(12)).toEqual([10, 12]);
  });
});

describe('restStepFor', () => {
  it('hangs the whole rest higher than the half rest sits', () => {
    // The two share an outline, so only their placement tells them apart —
    // the gap between them survives the per-voice shift.
    expect(restStepFor('h', 'soprano') - restStepFor('w', 'soprano')).toBe(2);
    expect(restStepFor('h', 'alto') - restStepFor('w', 'alto')).toBe(2);
  });

  it('gives the shorter rests one home', () => {
    for (const voice of ['soprano', 'alto'] as const) {
      const short = (['q', 'e', 's'] as const).map((base) => restStepFor(base, voice));
      expect(new Set(short).size, voice).toBe(1);
    }
  });

  it('lifts the upper voice‘s rests and drops the lower voice‘s', () => {
    // Two voices share every stave, so a rest parked in the middle would sit
    // exactly where the other voice is singing.
    expect(restStepFor('q', 'soprano')).toBeLessThan(restStepFor('q', 'alto'));
    expect(restStepFor('q', 'tenor')).toBeLessThan(restStepFor('q', 'bass'));
    expect(restStepFor('w', 'soprano')).toBeLessThan(restStepFor('w', 'alto'));
  });

  it('keeps both voices‘ rests on the stave', () => {
    for (const voice of ['soprano', 'alto', 'tenor', 'bass'] as const) {
      for (const base of ['w', 'h', 'q', 'e', 's'] as const) {
        const step = restStepFor(base, voice);
        expect(step, `${voice} ${base}`).toBeGreaterThanOrEqual(0);
        expect(step, `${voice} ${base}`).toBeLessThanOrEqual(8);
      }
    }
  });
});
