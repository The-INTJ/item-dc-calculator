import type {
  FilterCategory,
  FilterState,
  HymnEntry,
  HymnSearchResult,
  SearchMatch,
  SortDirection,
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

export function toggleFilterGroup(
  filters: FilterState,
  category: FilterCategory,
  values: string[],
): FilterState {
  if (values.length === 0) return filters;

  const selected = new Set(filters[category]);
  const hasAnySelected = values.some((value) => selected.has(value));

  if (hasAnySelected) {
    values.forEach((value) => selected.delete(value));
  } else {
    values.forEach((value) => selected.add(value));
  }

  return {
    ...filters,
    [category]: [...selected],
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
    includesAny(entry.meter ? [entry.meter] : [], filters.meter)
  );
}

function normalized(value: string): string {
  return value.toLocaleLowerCase();
}

function findMatches(
  field: SearchMatch['field'],
  value: string | undefined,
  query: string,
): SearchMatch[] {
  if (!value || query.length === 0) return [];

  const matches: SearchMatch[] = [];
  const normalizedValue = normalized(value);
  let cursor = 0;

  while (cursor < normalizedValue.length) {
    const start = normalizedValue.indexOf(query, cursor);
    if (start < 0) break;

    matches.push({
      field,
      value,
      start,
      end: start + query.length,
    });
    cursor = start + query.length;
  }

  return matches;
}

function getEntryMatches(entry: HymnEntry, query: string): SearchMatch[] {
  if (query.length === 0) return [];

  const fieldMatches = [
    /^\d+$/.test(query) ? findMatches('number', String(entry.number), query) : [],
    findMatches('title', entry.title, query),
    findMatches('firstLine', entry.firstLine, query),
    findMatches('chorusFirstLine', entry.chorusFirstLine, query),
    findMatches('tuneName', entry.tuneName, query),
    findMatches('era', entry.era, query),
    findMatches('meter', entry.meter, query),
    ...entry.themes.map((theme) => findMatches('theme', theme, query)),
  ].flat();

  const contributorMatches = entry.contributors
    .map((person) => findMatches('contributors', person.displayName, query))
    .flat();

  return [...fieldMatches, ...contributorMatches];
}

function sortResults(
  results: HymnSearchResult[],
  sortKey: SortKey,
  sortDirection: SortDirection,
): HymnSearchResult[] {
  const eraRank = new Map<string, number>(eras.map((era, index) => [era, index]));
  const sorted = [...results];

  sorted.sort((a, b) => {
    let result = 0;

    if (sortKey === 'number') {
      result = a.entry.number - b.entry.number;
    } else if (sortKey === 'era') {
      result =
        (eraRank.get(a.entry.era) ?? 0) - (eraRank.get(b.entry.era) ?? 0) ||
        a.entry.title.localeCompare(b.entry.title);
    } else if (sortKey === 'tune') {
      result =
        (a.entry.tuneName ?? '').localeCompare(b.entry.tuneName ?? '') ||
        a.entry.number - b.entry.number;
    } else {
      result = a.entry.title.localeCompare(b.entry.title) || a.entry.number - b.entry.number;
    }

    return sortDirection === 'desc' ? -result : result;
  });

  return sorted;
}

export function searchHymns(
  entries: HymnEntry[],
  query: string,
  filters: FilterState,
  sortKey: SortKey,
  sortDirection: SortDirection = 'asc',
): HymnSearchResult[] {
  const normalizedQuery = normalized(query.trim());

  const results = entries
    .filter((entry) => entryPassesFilters(entry, filters))
    .map((entry) => ({
      entry,
      matches: getEntryMatches(entry, normalizedQuery),
    }))
    .filter((result) => normalizedQuery.length === 0 || result.matches.length > 0);

  return sortResults(results, sortKey, sortDirection);
}
