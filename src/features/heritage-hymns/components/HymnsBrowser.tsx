'use client';

import { useState } from 'react';
import { hymnCatalog } from '../lib/catalog';
import {
  createEmptyFilters,
  getActiveFilterCount,
  searchHymns,
  toggleFilterGroup,
  toggleFilterValue,
} from '../lib/search';
import { buildSearchSuggestions } from '../lib/suggestions';
import type { FilterCategory, FilterState, SortDirection, SortKey } from '../lib/types';
import { sortLabels } from '../lib/filter-options';
import { HymnCard } from './HymnCard';
import { MaterialSymbol } from './MaterialSymbol';
import { RefinePanel } from './RefinePanel';
import styles from './HeritageHymnsDemo.module.scss';

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function HymnsBrowser() {
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => createEmptyFilters());
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('theme');
  const [isRefineOpen, setIsRefineOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const results = searchHymns(hymnCatalog, query, filters, sortKey, sortDirection);
  const suggestions = buildSearchSuggestions(hymnCatalog, query);
  const showSuggestions = isSearchFocused && suggestions.length > 0;
  const activeFilterCount = getActiveFilterCount(filters);
  const resultLabel = `${results.length} ${results.length === 1 ? 'hymn' : 'hymns'}`;

  function toggleFilter(category: FilterCategory, value: string) {
    setFilters((current) => toggleFilterValue(current, category, value));
  }

  function toggleGroup(category: FilterCategory, values: string[]) {
    setFilters((current) => toggleFilterGroup(current, category, values));
  }

  function clearAll() {
    setFilters(createEmptyFilters());
  }

  function toggleSortDirection() {
    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
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
    <>
      <section className={styles.searchDock} aria-label="Search and sort hymns">
        <div className={styles.searchFieldWrap}>
          <div className={styles.searchField}>
            <input
              aria-label="Search hymns"
              type="search"
              value={query}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search number, title, first line, tune, or contributor"
            />
          </div>
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
        <div className={styles.searchActions}>
          <div className={styles.resultCount} aria-live="polite">
            {resultLabel}
          </div>
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
          {activeFilterCount > 0 ? (
            <button type="button" className={styles.clearSearchAction} onClick={clearAll}>
              Clear All
            </button>
          ) : null}
          <div className={styles.sortControl}>
            <label className={styles.srOnly} htmlFor="hymn-sort">
              Sort hymns
            </label>
            <select
              id="hymn-sort"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
            >
              {sortLabels.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.sortDirectionButton}
              onClick={toggleSortDirection}
              aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
              title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            >
              <MaterialSymbol icon={sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'} />
            </button>
          </div>
        </div>
      </section>

      <div className={cx(styles.contentGrid, isRefineOpen && styles.contentGridWithRefine)}>
        <div className={cx(styles.desktopRefine, !isRefineOpen && styles.desktopRefineClosed)}>
          <RefinePanel
            activeCategory={activeCategory}
            filters={filters}
            onCategoryChange={setActiveCategory}
            onToggleFilter={toggleFilter}
            onToggleGroup={toggleGroup}
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
              onToggleGroup={toggleGroup}
              onClearAll={clearAll}
              onClose={() => setIsDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
