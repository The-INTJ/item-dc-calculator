import { describe, expect, it } from 'vitest';
import { UNITS_PER_MEASURE } from '../timing';
import { decomposeNoteSpan, decomposeRestSpan } from './duration-notation';

/** "q.‿e" — the written shape of a span, compact enough to assert on directly. */
function spell(startUnit: number, units: number): string {
  return decomposeNoteSpan(startUnit, units)
    .map((value) => `${value.base}${'.'.repeat(value.dots)}${value.tieToNext ? '‿' : ''}`)
    .join('');
}

function spellRests(startUnit: number, units: number): string {
  return decomposeRestSpan(startUnit, units)
    .map((rest) => rest.base)
    .join(' ');
}

describe('decomposeNoteSpan', () => {
  it('writes the lengths that have their own symbol as one note', () => {
    expect(spell(0, 16)).toBe('w');
    expect(spell(0, 12)).toBe('h.');
    expect(spell(0, 8)).toBe('h');
    expect(spell(0, 6)).toBe('q.');
    expect(spell(0, 4)).toBe('q');
    expect(spell(0, 3)).toBe('e.');
    expect(spell(0, 2)).toBe('e');
    expect(spell(0, 1)).toBe('s');
  });

  it('ties the lengths that have no symbol', () => {
    expect(spell(0, 5)).toBe('q‿s');
    expect(spell(0, 7)).toBe('q‿e.');
    expect(spell(0, 9)).toBe('h‿s');
    expect(spell(0, 10)).toBe('h‿e');
    expect(spell(0, 11)).toBe('h‿e.');
    expect(spell(0, 13)).toBe('h‿q‿s');
    expect(spell(0, 14)).toBe('h‿q.');
    expect(spell(0, 15)).toBe('h‿q‿e.');
  });

  it('lets a long note off the beat cover the middle of the bar', () => {
    // The classic syncopation: a half note starting on beat 2 is written as one
    // note, because it starts on a beat and is long enough to carry the span.
    expect(spell(4, 8)).toBe('h');
    // An eighth in and it no longer starts on a beat, so the middle of the bar
    // has to show: a dotted quarter up to it, then the remainder.
    expect(spell(2, 8)).toBe('q.‿e');
  });

  it('will not let a short note hide a beat', () => {
    // A dotted eighth from the last sixteenth of beat 1 would swallow beat 2.
    expect(spell(3, 3)).toBe('s‿e');
    // A quarter starting half a beat late may cover the beat — long enough, and
    // it still sits on the half-beat pulse.
    expect(spell(2, 4)).toBe('q');
  });

  it('always breaks a note at the barline', () => {
    expect(spell(12, 8)).toBe('q‿q');
    expect(spell(8, 16)).toBe('h‿h');
  });

  it('preserves the span exactly, for every start and length in a bar', () => {
    for (let start = 0; start < UNITS_PER_MEASURE; start += 1) {
      for (let units = 1; units <= UNITS_PER_MEASURE - start; units += 1) {
        const values = decomposeNoteSpan(start, units);
        const total = values.reduce((sum, value) => sum + value.units, 0);
        expect(total, `total of (${start}, ${units})`).toBe(units);
        expect(values[0]?.startUnit, `start of (${start}, ${units})`).toBe(start);
        // Every piece follows the one before with no gap and no overlap.
        let cursor = start;
        for (const value of values) {
          expect(value.startUnit, `run of (${start}, ${units})`).toBe(cursor);
          cursor += value.units;
        }
        // Ties join the chain and never dangle off the end.
        const ties = values.map((value) => value.tieToNext);
        expect(ties.slice(0, -1).every(Boolean), `ties of (${start}, ${units})`).toBe(true);
        expect(ties[ties.length - 1], `final tie of (${start}, ${units})`).toBe(false);
      }
    }
  });

  it('never writes a value that hides a barline', () => {
    for (let start = 0; start < 2 * UNITS_PER_MEASURE; start += 1) {
      for (let units = 1; units <= 2 * UNITS_PER_MEASURE - start; units += 1) {
        for (const value of decomposeNoteSpan(start, units)) {
          const crossesBar =
            Math.floor(value.startUnit / UNITS_PER_MEASURE) !==
            Math.floor((value.startUnit + value.units - 1) / UNITS_PER_MEASURE);
          expect(crossesBar, `(${value.startUnit}, ${value.units})`).toBe(false);
        }
      }
    }
  });

  it('has nothing to write for an empty span', () => {
    expect(decomposeNoteSpan(0, 0)).toEqual([]);
  });
});

describe('decomposeRestSpan', () => {
  it('stands an empty bar on a single whole rest', () => {
    expect(spellRests(0, 16)).toBe('w');
    expect(spellRests(16, 16)).toBe('w');
  });

  it('merges only into half-bars', () => {
    expect(spellRests(0, 8)).toBe('h');
    expect(spellRests(8, 8)).toBe('h');
    // Beat 2 through beat 3 straddles the middle of the bar, so it stays two
    // quarter rests rather than becoming a half.
    expect(spellRests(4, 8)).toBe('q q');
  });

  it('spells the rest of a silence beat by beat', () => {
    expect(spellRests(0, 4)).toBe('q');
    expect(spellRests(4, 4)).toBe('q');
    expect(spellRests(0, 12)).toBe('h q');
  });

  it('uses no dotted rests', () => {
    expect(spellRests(0, 3)).toBe('e s');
    expect(spellRests(1, 3)).toBe('s e');
    expect(spellRests(4, 6)).toBe('q e');
  });

  it('covers the gap exactly wherever it starts', () => {
    for (let start = 0; start < 2 * UNITS_PER_MEASURE; start += 1) {
      for (let units = 1; units <= 2 * UNITS_PER_MEASURE - start; units += 1) {
        const rests = decomposeRestSpan(start, units);
        const total = rests.reduce((sum, rest) => sum + rest.units, 0);
        expect(total, `total of (${start}, ${units})`).toBe(units);
        let cursor = start;
        for (const rest of rests) {
          expect(rest.startUnit, `run of (${start}, ${units})`).toBe(cursor);
          cursor += rest.units;
        }
      }
    }
  });

  it('has nothing to write for no gap', () => {
    expect(decomposeRestSpan(4, 0)).toEqual([]);
  });
});
