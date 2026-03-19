import { describe, it, expect } from 'vitest';
import type { ContestConfig } from '../../contexts/contest/contestTypes';
import { getContestantLabel, getContestantLabelPlural, getEntryLabel, getEntryLabelPlural } from './contestLabels';

const baseConfig: ContestConfig = {
  topic: 'Mixology',
  attributes: [],
};

describe('contestLabels', () => {
  it('returns default labels when config is undefined', () => {
    expect(getContestantLabel(undefined)).toBe('Contestant');
    expect(getContestantLabelPlural(undefined)).toBe('Contestants');
    expect(getEntryLabel(undefined)).toBe('Entry');
    expect(getEntryLabelPlural(undefined)).toBe('Entries');
  });

  it('returns default labels when config has no custom labels', () => {
    expect(getContestantLabel(baseConfig)).toBe('Contestant');
    expect(getContestantLabelPlural(baseConfig)).toBe('Contestants');
  });

  it('returns custom labels when provided', () => {
    const config: ContestConfig = {
      ...baseConfig,
      contestantLabel: 'Mixologist',
      contestantLabelPlural: 'Mixologists',
      entryLabel: 'Drink',
      entryLabelPlural: 'Drinks',
    };
    expect(getContestantLabel(config)).toBe('Mixologist');
    expect(getContestantLabelPlural(config)).toBe('Mixologists');
    expect(getEntryLabel(config)).toBe('Drink');
    expect(getEntryLabelPlural(config)).toBe('Drinks');
  });
});
