import { eras, hymnCatalog, meters, themeOptions } from './catalog';
import type { FilterCategory, SortKey, ThemeOption } from './types';

export interface FilterOption {
  value: string;
  label: string;
  selectable: boolean;
  depth?: ThemeOption['depth'];
  children?: string[];
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

function buildContributorOptions(): FilterOption[] {
  const contributors = new Map<string, { label: string; sortName: string }>();

  hymnCatalog.forEach((entry) => {
    entry.contributors.forEach((person) => {
      contributors.set(person.displayName, {
        label: person.displayName,
        sortName: person.sortName,
      });
    });
  });

  return [...contributors.values()]
    .sort((a, b) => a.sortName.localeCompare(b.sortName))
    .map((person) => ({
      value: person.label,
      label: person.label,
      selectable: true,
    }));
}

function getThemeChildren(parentIndex: number): string[] {
  const children: string[] = [];

  for (let index = parentIndex + 1; index < themeOptions.length; index += 1) {
    const theme = themeOptions[index];
    if (theme.depth !== 1) break;
    if (theme.selectable) children.push(theme.label);
  }

  return children;
}

function buildThemeOptions(): FilterOption[] {
  return themeOptions.map((theme, index) => ({
    value: theme.label,
    label: theme.label,
    selectable: theme.selectable,
    depth: theme.depth,
    children: theme.selectable ? undefined : getThemeChildren(index),
  }));
}

export const filterOptions: Record<FilterCategory, FilterOption[]> = {
  theme: buildThemeOptions(),
  contributors: buildContributorOptions(),
  era: eras.map((era) => ({
    value: era,
    label: era,
    selectable: true,
  })),
  meter: meters.map((meter) => ({
    value: meter,
    label: meter,
    selectable: true,
  })),
};
