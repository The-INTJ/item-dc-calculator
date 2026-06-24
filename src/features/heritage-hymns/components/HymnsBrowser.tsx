'use client';

import { useState } from 'react';
import { hymnCatalog } from '../lib/catalog';
import {
  createEmptyFilters,
  getActiveFilterCount,
  searchHymns,
  toggleFilterValue,
} from '../lib/search';
import { buildSearchSuggestions } from '../lib/suggestions';
import type { FilterCategory, FilterState, SortDirection, SortKey } from '../lib/types';
import { categoryLabels, sortLabels } from '../lib/filter-options';
import { HymnCard } from './HymnCard';
import { MaterialSymbol } from './MaterialSymbol';
import { RefinePanel } from './RefinePanel';
import styles from './HeritageHymnsDemo.module.scss';

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function activeFilters(filters: FilterState): Array<{ category: FilterCategory; value: string }> {
  return (Object.keys(filters) as FilterCategory[]).flatMap((category) =>
    filters[category].map((value) => ({ category, value })),
  );
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
    <>
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
    </>
  );
}
