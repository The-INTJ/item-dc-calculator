import { describe, expect, it } from 'vitest';
import { hymnCatalog } from './catalog';
import {
  createEmptyFilters,
  getActiveFilterCount,
  searchHymns,
  toggleFilterGroup,
  toggleFilterValue,
} from './search';

describe('heritage hymns search helpers', () => {
  it('builds the demo catalog with exactly 573 dummy hymns', () => {
    expect(hymnCatalog).toHaveLength(573);
  });

  it('uses one assigned theme per dummy hymn', () => {
    expect(hymnCatalog.every((entry) => entry.themes.length === 1)).toBe(true);
  });

  it('searches contributors and returns highlight ranges', () => {
    const results = searchHymns(hymnCatalog, 'waters', createEmptyFilters(), 'title');

    expect(results).toHaveLength(1);
    expect(results[0].entry.title).toBe('Waters of Mercy Flow');

    const contributorMatch = results[0].matches.find((match) => match.field === 'contributors');
    expect(contributorMatch).toBeDefined();
    expect(contributorMatch?.value.slice(contributorMatch.start, contributorMatch.end)).toBe('Waters');
  });

  it('searches hymn numbers when the query is numeric', () => {
    const results = searchHymns(hymnCatalog, '227', createEmptyFilters(), 'title');

    expect(results).toHaveLength(1);
    expect(results[0].entry.number).toBe(227);
    expect(results[0].matches[0]).toMatchObject({
      field: 'number',
      value: '227',
      start: 0,
      end: 3,
    });
  });

  it('applies OR within a category and AND across categories', () => {
    const filters = {
      ...createEmptyFilters(),
      theme: ["Christ's Return", 'The Reigning King'],
      era: ['21st Century'],
    };
    const results = searchHymns(hymnCatalog, '', filters, 'title');

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        ({ entry }) =>
          entry.era === '21st Century' &&
          entry.themes.some((theme) => theme === "Christ's Return" || theme === 'The Reigning King'),
      ),
    ).toBe(true);
  });

  it('narrows across theme and contributor selections', () => {
    const filters = {
      ...createEmptyFilters(),
      theme: ["God's Mercy"],
      contributors: ['Elias Waters'],
    };
    const results = searchHymns(hymnCatalog, '', filters, 'title');

    expect(results.map((result) => result.entry.number)).toEqual([42]);
  });

  it('sorts by hymn number', () => {
    const results = searchHymns(hymnCatalog, '', createEmptyFilters(), 'number');

    expect(results[0].entry.number).toBe(1);
    expect(results.at(-1)?.entry.number).toBe(573);
  });

  it('tracks active filter counts while toggling', () => {
    const first = toggleFilterValue(createEmptyFilters(), 'theme', 'Redemption');
    const second = toggleFilterValue(first, 'era', '20th Century');
    const third = toggleFilterValue(second, 'theme', 'Redemption');

    expect(getActiveFilterCount(first)).toBe(1);
    expect(getActiveFilterCount(second)).toBe(2);
    expect(getActiveFilterCount(third)).toBe(1);
  });

  it('toggles filter groups as a unit', () => {
    const first = toggleFilterGroup(createEmptyFilters(), 'theme', ["God's Eternity", "God's Grace"]);
    const second = toggleFilterGroup(first, 'theme', ["God's Eternity", "God's Grace"]);

    expect(first.theme).toEqual(["God's Eternity", "God's Grace"]);
    expect(second.theme).toEqual([]);
  });

  it('returns an empty list when no search fields match', () => {
    expect(searchHymns(hymnCatalog, 'zzzz-not-here', createEmptyFilters(), 'title')).toEqual([]);
  });
});
