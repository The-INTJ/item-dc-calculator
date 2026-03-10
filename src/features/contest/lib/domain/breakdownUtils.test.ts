import { describe, expect, it } from 'vitest';
import {
  addBreakdowns,
  createEmptyBreakdown,
  diffBreakdowns,
} from './breakdownUtils';

describe('breakdownUtils', () => {
  it('builds a zeroed breakdown for configured attributes', () => {
    expect(createEmptyBreakdown(['aroma', 'balance'])).toEqual({
      aroma: 0,
      balance: 0,
    });
  });

  it('adds and diffs breakdown values across key sets', () => {
    expect(
      addBreakdowns(
        { aroma: 3, balance: 4 },
        { aroma: 2, finish: 5 },
      ),
    ).toEqual({
      aroma: 5,
      balance: 4,
      finish: 5,
    });

    expect(
      diffBreakdowns(
        { aroma: 5, finish: 5 },
        { aroma: 2, balance: 4 },
      ),
    ).toEqual({
      aroma: 3,
      finish: 5,
      balance: -4,
    });
  });
});
