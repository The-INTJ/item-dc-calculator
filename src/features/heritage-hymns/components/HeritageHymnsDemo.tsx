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
  { value: 'number', label: 'Hymn number' },
  { value: 'era', label: 'Era' },
  { value: 'tune', label: 'Tune' },
];

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
        label="Words & Music"
        value={words.join(', ')}
        matches={contributorMatchesForNames(result, words)}
      />
    );
  }

  return (
    <>
      {words.length > 0 ? (
        <MetadataRow
          label="Words"
          value={words.join(', ')}
          matches={contributorMatchesForNames(result, words)}
        />
      ) : null}
      {music.length > 0 ? (
        <MetadataRow
          label="Music"
          value={music.join(', ')}
          matches={contributorMatchesForNames(result, music)}
        />
      ) : null}
      {additional.length > 0 ? (
        <MetadataRow
          label="Additional"
          value={additional.join(', ')}
          matches={contributorMatchesForNames(result, additional)}
        />
      ) : null}
    </>
  );
}

function MetadataRow({
  label,
  value,
  matches,
}: {
  label: string;
  value: string;
  matches: SearchMatch[];
}) {
  return (
    <div className={styles.metadataRow}>
      <dt>{label}</dt>
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
        <header className={styles.hymnHeader}>
          <h2>
            <HighlightedText value={entry.title} matches={matchesFor(matches, 'title', entry.title)} />
          </h2>
          <div className={styles.themeRail} aria-label="Themes">
            {entry.themes.map((theme) => (
              <span key={theme}>{theme}</span>
            ))}
          </div>
        </header>
        <dl className={styles.metadataList}>
          <AttributionRows result={result} />
          <MetadataRow
            label="First Line"
            value={entry.firstLine}
            matches={matchesFor(matches, 'firstLine', entry.firstLine)}
          />
          {entry.chorusFirstLine ? (
            <MetadataRow
              label="Chorus"
              value={entry.chorusFirstLine}
              matches={matchesFor(matches, 'chorusFirstLine', entry.chorusFirstLine)}
            />
          ) : null}
        </dl>
        <footer className={styles.hymnFooter}>
          <span>{entry.era}</span>
          <span>
            <HighlightedText value={entry.tuneName} matches={matchesFor(matches, 'tuneName', entry.tuneName)} />
          </span>
          <span>{entry.meter}</span>
        </footer>
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
  const [filters, setFilters] = useState<FilterState>(() => createEmptyFilters());
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('theme');
  const [isRefineOpen, setIsRefineOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const results = searchHymns(hymnCatalog, query, filters, sortKey);
  const activeFilterCount = getActiveFilterCount(filters);
  const resultLabel = `${results.length} ${results.length === 1 ? 'hymn' : 'hymns'}`;
  const selectedFilters = activeFilters(filters);

  function toggleFilter(category: FilterCategory, value: string) {
    setFilters((current) => toggleFilterValue(current, category, value));
  }

  function clearAll() {
    setFilters(createEmptyFilters());
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
            <h1 id="collection-title">Hymns rooted in biblical truth for the praise of God.</h1>
          </div>
          <p>
            A curated treasury of sacred song for congregational worship, family devotion,
            and quiet discovery.
          </p>
        </section>

        <section className={styles.searchDock} aria-label="Search and sort hymns">
          <label className={styles.searchField}>
            <span>Search hymns</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Number, title, line, tune, or contributor"
            />
          </label>
          <button
            type="button"
            className={styles.filterToggle}
            onClick={() => {
              setIsRefineOpen((current) => !current);
              setIsDrawerOpen(true);
            }}
            aria-expanded={isRefineOpen || isDrawerOpen}
          >
            <span>Filters</span>
            {activeFilterCount > 0 ? <em>{activeFilterCount}</em> : null}
          </button>
          <div className={styles.resultCount} aria-live="polite">
            {resultLabel}
          </div>
          <label className={styles.sortControl}>
            <span>Sort by</span>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
              {sortLabels.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
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
          {isRefineOpen ? (
            <div className={styles.desktopRefine}>
              <RefinePanel
                activeCategory={activeCategory}
                filters={filters}
                onCategoryChange={setActiveCategory}
                onToggleFilter={toggleFilter}
                onClearAll={clearAll}
              />
            </div>
          ) : null}
          <section className={styles.results} aria-label="Hymn results">
            {results.length > 0 ? (
              results.map((result) => <HymnCard key={result.entry.id} result={result} />)
            ) : (
              <div className={styles.emptyState}>
                <h2>No hymns found</h2>
                <p>The shaped collection is empty.</p>
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
