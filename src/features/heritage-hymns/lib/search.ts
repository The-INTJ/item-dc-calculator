import type {
  FilterCategory,
  FilterState,
  HymnEntry,
  HymnSearchResult,
  SearchMatch,
  SortKey,
} from './types';
import { eras } from './catalog';

export const filterCategories: FilterCategory[] = ['theme', 'contributors', 'era', 'meter'];

export function createEmptyFilters(): FilterState {
  return {
    theme: [],
    contributors: [],
    era: [],
    meter: [],
  };
}

export function getActiveFilterCount(filters: FilterState): number {
  return filterCategories.reduce((count, category) => count + filters[category].length, 0);
}

export function toggleFilterValue(
  filters: FilterState,
  category: FilterCategory,
  value: string,
): FilterState {
  const values = filters[category];
  const nextValues = values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

  return {
    ...filters,
    [category]: nextValues,
  };
}

function includesAny(values: string[], selected: string[]): boolean {
  return selected.length === 0 || values.some((value) => selected.includes(value));
}

function entryPassesFilters(entry: HymnEntry, filters: FilterState): boolean {
  return (
    includesAny(entry.themes, filters.theme) &&
    includesAny(entry.contributors.map((person) => person.displayName), filters.contributors) &&
    includesAny([entry.era], filters.era) &&
    includesAny([entry.meter], filters.meter)
  );
}

function normalized(value: string): string {
  return value.toLocaleLowerCase();
}

function findMatch(
  field: SearchMatch['field'],
  value: string | undefined,
  query: string,
): SearchMatch | null {
  if (!value) return null;

  const start = normalized(value).indexOf(query);
  if (start < 0) return null;

  return {
    field,
    value,
    start,
    end: start + query.length,
  };
}

function getEntryMatches(entry: HymnEntry, query: string): SearchMatch[] {
  if (query.length === 0) return [];

  const fieldMatches = [
    /^\d+$/.test(query) ? findMatch('number', String(entry.number), query) : null,
    findMatch('title', entry.title, query),
    findMatch('firstLine', entry.firstLine, query),
    findMatch('chorusFirstLine', entry.chorusFirstLine, query),
    findMatch('tuneName', entry.tuneName, query),
  ].filter((match): match is SearchMatch => match !== null);

  const contributorMatches = entry.contributors
    .map((person) => findMatch('contributors', person.displayName, query))
    .filter((match): match is SearchMatch => match !== null);

  return [...fieldMatches, ...contributorMatches];
}

function sortResults(results: HymnSearchResult[], sortKey: SortKey): HymnSearchResult[] {
  const eraRank = new Map<string, number>(eras.map((era, index) => [era, index]));
  const sorted = [...results];

  sorted.sort((a, b) => {
    if (sortKey === 'number') {
      return a.entry.number - b.entry.number;
    }

    if (sortKey === 'era') {
      const eraDelta = (eraRank.get(a.entry.era) ?? 0) - (eraRank.get(b.entry.era) ?? 0);
      return eraDelta || a.entry.title.localeCompare(b.entry.title);
    }

    if (sortKey === 'tune') {
      return a.entry.tuneName.localeCompare(b.entry.tuneName) || a.entry.number - b.entry.number;
    }

    return a.entry.title.localeCompare(b.entry.title) || a.entry.number - b.entry.number;
  });

  return sorted;
}

export function searchHymns(
  entries: HymnEntry[],
  query: string,
  filters: FilterState,
  sortKey: SortKey,
): HymnSearchResult[] {
  const normalizedQuery = normalized(query.trim());

  const results = entries
    .filter((entry) => entryPassesFilters(entry, filters))
    .map((entry) => ({
      entry,
      matches: getEntryMatches(entry, normalizedQuery),
    }))
    .filter((result) => normalizedQuery.length === 0 || result.matches.length > 0);

  return sortResults(results, sortKey);
}
