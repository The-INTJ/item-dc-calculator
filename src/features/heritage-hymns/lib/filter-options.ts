import { eras, hymnCatalog, meters, themeOptions } from './catalog';
import type { FilterCategory, SortKey, ThemeOption } from './types';

export interface FilterOption {
  value: string;
  label: string;
  selectable: boolean;
  count?: number;
  depth?: ThemeOption['depth'];
}

export const categoryLabels: Record<FilterCategory, string> = {
  theme: 'Theme',
  contributors: 'Contributors',
  era: 'Era',
  meter: 'Meter',
};

export const sortLabels: Array<{ value: SortKey; label: string }> = [
  { value: 'title', label: 'Title' },
  { value: 'number', label: 'Number' },
  { value: 'era', label: 'Era' },
  { value: 'tune', label: 'Tune' },
];

function getOptionCount(category: FilterCategory, value: string): number {
  return hymnCatalog.filter((entry) => {
    if (category === 'theme') return entry.themes.includes(value);
    if (category === 'contributors') {
      return entry.contributors.some((person) => person.displayName === value);
    }
    if (category === 'era') return entry.era === value;
    return entry.meter === value;
  }).length;
}

function buildContributorOptions(): FilterOption[] {
  const contributors = new Map<string, { label: string; sortName: string; count: number }>();

  hymnCatalog.forEach((entry) => {
    entry.contributors.forEach((person) => {
      const current = contributors.get(person.displayName);
      contributors.set(person.displayName, {
        label: person.displayName,
        sortName: person.sortName,
        count: (current?.count ?? 0) + 1,
      });
    });
  });

  return [...contributors.values()]
    .sort((a, b) => a.sortName.localeCompare(b.sortName))
    .map((person) => ({
      value: person.label,
      label: person.label,
      selectable: true,
      count: person.count,
    }));
}

export const filterOptions: Record<FilterCategory, FilterOption[]> = {
  theme: themeOptions.map((theme) => ({
    value: theme.label,
    label: theme.label,
    selectable: theme.selectable,
    count: theme.selectable ? getOptionCount('theme', theme.label) : undefined,
    depth: theme.depth,
  })),
  contributors: buildContributorOptions(),
  era: eras.map((era) => ({
    value: era,
    label: era,
    selectable: true,
    count: getOptionCount('era', era),
  })),
  meter: meters.map((meter) => ({
    value: meter,
    label: meter,
    selectable: true,
    count: getOptionCount('meter', meter),
  })),
};
