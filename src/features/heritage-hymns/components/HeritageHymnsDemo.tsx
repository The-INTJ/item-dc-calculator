'use client';

import { useState, type ReactNode } from 'react';
import { eras, hymnCatalog, meters, themeOptions } from '../lib/catalog';
import {
  createEmptyFilters,
  getActiveFilterCount,
  searchHymns,
  toggleFilterValue,
} from '../lib/search';
import type {
  ContributorRole,
  FilterCategory,
  FilterState,
  HymnEntry,
  HymnSearchResult,
  SearchMatch,
  SortDirection,
  SortKey,
  ThemeOption,
} from '../lib/types';
import styles from './HeritageHymnsDemo.module.scss';

interface FilterOption {
  value: string;
  label: string;
  selectable: boolean;
  count?: number;
  depth?: ThemeOption['depth'];
}

const categoryLabels: Record<FilterCategory, string> = {
  theme: 'Theme',
  contributors: 'Contributors',
  era: 'Era',
  meter: 'Meter',
};

const sortLabels: Array<{ value: SortKey; label: string }> = [
  { value: 'title', label: 'Title' },
  { value: 'number', label: 'Number' },
  { value: 'era', label: 'Era' },
  { value: 'tune', label: 'Tune' },
];

interface SearchSuggestion {
  id: string;
  field: 'Number' | 'Title' | 'First Line' | 'Chorus' | 'Tune' | 'Contributor';
  value: string;
  completion: string;
}

type MetadataKind = 'words' | 'music' | 'additional' | 'firstLine' | 'chorus';

const metadataLabels: Record<MetadataKind, string> = {
  words: 'Words',
  music: 'Music',
  additional: 'Additional',
  firstLine: 'First Line',
  chorus: 'Chorus',
};

function MaterialSymbol({ icon, className }: { icon: string; className?: string }) {
  return (
    <span className={cx(styles.materialSymbol, className)} aria-hidden="true">
      {icon}
    </span>
  );
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

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

const filterOptions: Record<FilterCategory, FilterOption[]> = {
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

function addSuggestion(
  suggestions: SearchSuggestion[],
  seen: Set<string>,
  suggestion: SearchSuggestion,
) {
  const key = `${suggestion.field}-${suggestion.value}`;
  if (!seen.has(key)) {
    seen.add(key);
    suggestions.push(suggestion);
  }
}

function includesQuery(value: string | undefined, query: string): boolean {
  return value?.toLocaleLowerCase().includes(query) ?? false;
}

function buildSearchSuggestions(query: string): SearchSuggestion[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedQuery.length === 0) return [];

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  for (const entry of hymnCatalog) {
    if (/^\d+$/.test(normalizedQuery) && String(entry.number).includes(normalizedQuery)) {
      addSuggestion(suggestions, seen, {
        id: `${entry.id}-number`,
        field: 'Number',
        value: String(entry.number),
        completion: String(entry.number),
      });
    }

    if (includesQuery(entry.title, normalizedQuery)) {
      addSuggestion(suggestions, seen, {
        id: `${entry.id}-title`,
        field: 'Title',
        value: entry.title,
        completion: entry.title,
      });
    }

    if (includesQuery(entry.firstLine, normalizedQuery)) {
      addSuggestion(suggestions, seen, {
        id: `${entry.id}-first-line`,
        field: 'First Line',
        value: entry.firstLine,
        completion: entry.firstLine,
      });
    }

    if (includesQuery(entry.chorusFirstLine, normalizedQuery)) {
      addSuggestion(suggestions, seen, {
        id: `${entry.id}-chorus`,
        field: 'Chorus',
        value: entry.chorusFirstLine ?? '',
        completion: entry.chorusFirstLine ?? '',
      });
    }

    if (includesQuery(entry.tuneName, normalizedQuery)) {
      addSuggestion(suggestions, seen, {
        id: `${entry.id}-tune`,
        field: 'Tune',
        value: entry.tuneName,
        completion: entry.tuneName,
      });
    }

    entry.contributors.forEach((person) => {
      if (includesQuery(person.displayName, normalizedQuery)) {
        addSuggestion(suggestions, seen, {
          id: `${entry.id}-${person.sortName}`,
          field: 'Contributor',
          value: person.displayName,
          completion: person.displayName,
        });
      }
    });

    if (suggestions.length >= 7) break;
  }

  return suggestions.slice(0, 7);
}

function matchesFor(matches: SearchMatch[], field: SearchMatch['field'], value: string): SearchMatch[] {
  return matches.filter((match) => match.field === field && match.value === value);
}

function HighlightedText({ value, matches }: { value: string; matches: SearchMatch[] }) {
  if (matches.length === 0) return <>{value}</>;

  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);
  const pieces: ReactNode[] = [];
  let cursor = 0;

  sortedMatches.forEach((match, index) => {
    if (match.start < cursor) return;
    if (match.start > cursor) {
      pieces.push(<span key={`text-${index}-${cursor}`}>{value.slice(cursor, match.start)}</span>);
    }
    pieces.push(<mark key={`mark-${index}-${match.start}`}>{value.slice(match.start, match.end)}</mark>);
    cursor = match.end;
  });

  if (cursor < value.length) {
    pieces.push(<span key={`text-end-${cursor}`}>{value.slice(cursor)}</span>);
  }

  return <>{pieces}</>;
}

function contributorsForRole(entry: HymnEntry, role: ContributorRole): string[] {
  return entry.contributors
    .filter((person) => person.roles.includes(role))
    .map((person) => person.displayName);
}

function contributorMatchesForNames(result: HymnSearchResult, names: string[]): SearchMatch[] {
  return result.matches.filter(
    (match) => match.field === 'contributors' && names.includes(match.value),
  );
}

function AttributionRows({ result }: { result: HymnSearchResult }) {
  const entry = result.entry;
  const words = contributorsForRole(entry, 'words');
  const music = contributorsForRole(entry, 'music');
  const additional = entry.contributors
    .filter((person) => person.roles.some((role) => role !== 'words' && role !== 'music'))
    .map((person) => person.displayName);
  const sameWordsAndMusic =
    words.length > 0 &&
    music.length > 0 &&
    words.length === music.length &&
    words.every((name) => music.includes(name));

  if (sameWordsAndMusic) {
    return (
      <MetadataRow
        kind="words"
        value={words.join(', ')}
        matches={contributorMatchesForNames(result, words)}
      />
    );
  }

  return (
    <>
      {words.length > 0 ? (
        <MetadataRow
          kind="words"
          value={words.join(', ')}
          matches={contributorMatchesForNames(result, words)}
        />
      ) : null}
      {music.length > 0 ? (
        <MetadataRow
          kind="music"
          value={music.join(', ')}
          matches={contributorMatchesForNames(result, music)}
        />
      ) : null}
      {additional.length > 0 ? (
        <MetadataRow
          kind="additional"
          value={additional.join(', ')}
          matches={contributorMatchesForNames(result, additional)}
        />
      ) : null}
    </>
  );
}

function MetadataRow({
  kind,
  value,
  matches,
}: {
  kind: MetadataKind;
  value: string;
  matches: SearchMatch[];
}) {
  return (
    <div className={cx(styles.metadataRow, styles[`metadataRow_${kind}`])}>
      <dt>{metadataLabels[kind]}</dt>
      <dd>
        <HighlightedText value={value} matches={matches} />
      </dd>
    </div>
  );
}

function HymnCard({ result }: { result: HymnSearchResult }) {
  const { entry, matches } = result;
  const number = String(entry.number);

  return (
    <article className={styles.hymnCard}>
      <div className={styles.hymnNumber}>
        <HighlightedText value={number} matches={matchesFor(matches, 'number', number)} />
      </div>
      <div className={styles.hymnBody}>
        <div className={styles.hymnContent}>
          <header className={styles.hymnHeader}>
            <h2>
              <HighlightedText value={entry.title} matches={matchesFor(matches, 'title', entry.title)} />
            </h2>
          </header>
          <dl className={styles.metadataList}>
            <AttributionRows result={result} />
            <MetadataRow
              kind="firstLine"
              value={entry.firstLine}
              matches={matchesFor(matches, 'firstLine', entry.firstLine)}
            />
            {entry.chorusFirstLine ? (
              <MetadataRow
                kind="chorus"
                value={entry.chorusFirstLine}
                matches={matchesFor(matches, 'chorusFirstLine', entry.chorusFirstLine)}
              />
            ) : null}
          </dl>
          <div className={styles.detailRail} aria-label="Era, tune, and meter">
            <span className={styles.detailPill}>{entry.era}</span>
            <span className={styles.detailPill}>
              <HighlightedText value={entry.tuneName} matches={matchesFor(matches, 'tuneName', entry.tuneName)} />
            </span>
            <span className={styles.detailPill}>{entry.meter}</span>
          </div>
        </div>
        <aside className={styles.hymnRightRail} aria-label="Themes">
          <div className={styles.themeRail} aria-label="Themes">
            {entry.themes.map((theme) => (
              <span className={styles.themePill} key={theme}>{theme}</span>
            ))}
          </div>
        </aside>
      </div>
    </article>
  );
}

function activeFilters(filters: FilterState): Array<{ category: FilterCategory; value: string }> {
  return (Object.keys(filters) as FilterCategory[]).flatMap((category) =>
    filters[category].map((value) => ({ category, value })),
  );
}

function RefinePanel({
  activeCategory,
  filters,
  onCategoryChange,
  onToggleFilter,
  onClearAll,
  onClose,
  drawer = false,
}: {
  activeCategory: FilterCategory;
  filters: FilterState;
  onCategoryChange: (category: FilterCategory) => void;
  onToggleFilter: (category: FilterCategory, value: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
  drawer?: boolean;
}) {
  const activeCount = getActiveFilterCount(filters);
  const options = filterOptions[activeCategory];

  return (
    <aside className={cx(styles.refinePanel, drawer && styles.refinePanelDrawer)} aria-label="Refine hymns">
      <header className={styles.refineHeader}>
        <div>
          <p>Refine</p>
          <strong>{activeCount === 0 ? 'Full collection' : `${activeCount} selected`}</strong>
        </div>
        <div className={styles.refineActions}>
          <button type="button" onClick={onClearAll} disabled={activeCount === 0}>
            Clear All
          </button>
          {onClose ? (
            <button type="button" className={styles.closeDrawerButton} onClick={onClose} aria-label="Close filters">
              Close
            </button>
          ) : null}
        </div>
      </header>
      <div className={styles.refineGrid}>
        <nav className={styles.categoryNav} aria-label="Filter categories">
          {(Object.keys(categoryLabels) as FilterCategory[]).map((category) => {
            const categoryCount = filters[category].length;
            return (
              <button
                type="button"
                key={category}
                className={cx(category === activeCategory && styles.categoryButtonActive)}
                onClick={() => onCategoryChange(category)}
                aria-pressed={category === activeCategory}
              >
                <span>{categoryLabels[category]}</span>
                {categoryCount > 0 ? <em>{categoryCount}</em> : null}
              </button>
            );
          })}
        </nav>
        <div className={styles.optionList} aria-label={`${categoryLabels[activeCategory]} options`}>
          {options.map((option) => {
            const selected = filters[activeCategory].includes(option.value);
            return (
              <button
                type="button"
                key={`${activeCategory}-${option.value}`}
                className={cx(
                  styles.optionButton,
                  selected && styles.optionButtonSelected,
                  option.depth === 1 && styles.optionButtonNested,
                  !option.selectable && styles.optionButtonGroup,
                )}
                disabled={!option.selectable}
                onClick={() => onToggleFilter(activeCategory, option.value)}
                aria-pressed={option.selectable ? selected : undefined}
              >
                <span className={styles.optionCheck} aria-hidden="true" />
                <span className={styles.optionLabel}>{option.label}</span>
                {option.count != null ? <span className={styles.optionCount}>{option.count}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export function HeritageHymnsDemo() {
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => createEmptyFilters());
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('theme');
  const [isRefineOpen, setIsRefineOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const results = searchHymns(hymnCatalog, query, filters, sortKey, sortDirection);
  const suggestions = buildSearchSuggestions(query);
  const showSuggestions = isSearchFocused && suggestions.length > 0;
  const activeFilterCount = getActiveFilterCount(filters);
  const resultLabel = `${results.length} ${results.length === 1 ? 'hymn' : 'hymns'}`;
  const selectedFilters = activeFilters(filters);

  function toggleFilter(category: FilterCategory, value: string) {
    setFilters((current) => toggleFilterValue(current, category, value));
  }

  function clearAll() {
    setFilters(createEmptyFilters());
  }

  function toggleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection('asc');
  }

  function toggleRefine() {
    const isMobile =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 880px)').matches;
    if (isMobile) {
      setIsDrawerOpen(true);
      return;
    }

    setIsRefineOpen((current) => !current);
  }

  return (
    <div className={styles.demoShell}>
      <header className={styles.siteHeader}>
        <a href="/heritage-hymns" className={styles.brandMark} aria-label="Heritage Hymns">
          <span className={styles.fleuron} aria-hidden="true" />
          <span>
            <strong>Heritage</strong>
            <strong>Hymns</strong>
          </span>
        </a>
        <nav className={styles.mainNav} aria-label="Heritage Hymns sections">
          <a href="/heritage-hymns" aria-current="page">Hymns</a>
          <a href="/heritage-hymns">Hymnals</a>
          <a href="/heritage-hymns">About</a>
          <a href="/heritage-hymns">Connect</a>
          <a href="/heritage-hymns" className={styles.donateLink}>Donate</a>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.collectionIntro} aria-labelledby="collection-title">
          <div>
            <p className={styles.eyebrow}>Treasures New & Old</p>
            <h1 id="collection-title">
              Hymns rooted in biblical truth for the exaltation of God and the edification of His people.
            </h1>
          </div>
          <p>A hymnal for congregational song, family worship, and personal devotion.</p>
        </section>

        <section className={styles.searchDock} aria-label="Search and sort hymns">
          <div className={styles.searchFieldWrap}>
            <label className={styles.searchField}>
              <span>Search hymns</span>
              <input
                type="search"
                value={query}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Number, title, line, tune, or contributor"
              />
            </label>
            {showSuggestions ? (
              <div className={styles.suggestions} role="listbox" aria-label="Search suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion.id}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setQuery(suggestion.completion);
                      setIsSearchFocused(false);
                    }}
                    role="option"
                  >
                    <span>{suggestion.field}</span>
                    <strong>{suggestion.value}</strong>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className={styles.resultCount} aria-live="polite">
            {resultLabel}
          </div>
        </section>

        <section className={styles.browseToolbar} aria-label="View controls">
          <button
            type="button"
            className={styles.filterToggle}
            onClick={toggleRefine}
            aria-expanded={isRefineOpen || isDrawerOpen}
          >
            <MaterialSymbol icon={isRefineOpen ? 'left_panel_close' : 'tune'} />
            <span>Filters</span>
            {activeFilterCount > 0 ? <em>{activeFilterCount}</em> : null}
          </button>
          <div className={styles.sortRail} aria-label="Sort hymns">
            {sortLabels.map((sort) => {
              const isActive = sort.value === sortKey;
              return (
                <button
                  type="button"
                  key={sort.value}
                  className={cx(isActive && styles.sortButtonActive)}
                  onClick={() => toggleSort(sort.value)}
                  aria-pressed={isActive}
                  title={isActive ? `${sort.label} ${sortDirection}` : sort.label}
                >
                  <span>{sort.label}</span>
                  {isActive ? (
                    <MaterialSymbol icon={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {selectedFilters.length > 0 ? (
          <section className={styles.activeFilters} aria-label="Active filters">
            {selectedFilters.map((filter) => (
              <button
                type="button"
                key={`${filter.category}-${filter.value}`}
                onClick={() => toggleFilter(filter.category, filter.value)}
              >
                <span>{categoryLabels[filter.category]}</span>
                {filter.value}
              </button>
            ))}
            <button type="button" className={styles.clearInline} onClick={clearAll}>
              Clear All
            </button>
          </section>
        ) : null}

        <div className={cx(styles.contentGrid, isRefineOpen && styles.contentGridWithRefine)}>
          <div className={cx(styles.desktopRefine, !isRefineOpen && styles.desktopRefineClosed)}>
            <RefinePanel
              activeCategory={activeCategory}
              filters={filters}
              onCategoryChange={setActiveCategory}
              onToggleFilter={toggleFilter}
              onClearAll={clearAll}
            />
          </div>
          <section className={styles.results} aria-label="Hymn results">
            {results.length > 0 ? (
              results.map((result) => (
                <HymnCard key={result.entry.id} result={result} />
              ))
            ) : (
              <div className={styles.emptyState}>
                <h2>No hymns</h2>
                <button type="button" onClick={clearAll}>
                  Clear All
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {isDrawerOpen ? (
        <div className={styles.drawerLayer}>
          <button
            type="button"
            className={styles.drawerScrim}
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close filters"
          />
          <div className={styles.drawerDialog} role="dialog" aria-modal="true" aria-label="Filters">
            <RefinePanel
              drawer
              activeCategory={activeCategory}
              filters={filters}
              onCategoryChange={setActiveCategory}
              onToggleFilter={toggleFilter}
              onClearAll={clearAll}
              onClose={() => setIsDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
