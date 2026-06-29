import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hymnCatalog } from '../lib/catalog';
import { filterOptions } from '../lib/filter-options';
import { createEmptyFilters, searchHymns } from '../lib/search';
import type { HymnEntry } from '../lib/types';
import { HeritageHymnsDemo } from './HeritageHymnsDemo';
import { HymnCard } from './HymnCard';

describe('HeritageHymnsDemo', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens on the Home tab by default with query-param nav links', () => {
    render(<HeritageHymnsDemo />);

    expect(screen.getByRole('heading', { name: 'Heritage Hymns' })).toBeTruthy();
    expect(screen.getByText('A hymnal for congregational song, family worship, and personal devotion.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Hymns' }).getAttribute('href')).toBe('/heritage-hymns?tab=hymns');
    expect(screen.getByRole('link', { name: 'For Jack' }).getAttribute('href')).toBe('/heritage-hymns?tab=for-jack');
  });

  it('opens the full dummy collection on the Hymns tab', () => {
    render(<HeritageHymnsDemo initialTab="hymns" />);

    expect(screen.getByText('573 hymns')).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: 'Search hymns' })).toBeTruthy();
    expect(screen.queryByText('Search hymns')).toBeNull();
    expect(screen.queryByText('Full collection')).toBeNull();
    expect(screen.getAllByText('Words').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Words & Music').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Available hymn materials')).toBeNull();
    expect(screen.queryByLabelText('Dev display toggle')).toBeNull();
  });

  it('updates the count and highlights matches while typing', () => {
    render(<HeritageHymnsDemo initialTab="hymns" />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search hymns' }), {
      target: { value: 'Waters' },
    });

    expect(screen.getByText('1 hymn')).toBeTruthy();
    expect(screen.getAllByText('Waters').length).toBeGreaterThan(0);
  });

  it('shows local search suggestions while typing', () => {
    render(<HeritageHymnsDemo initialTab="hymns" />);

    const search = screen.getByRole('searchbox', { name: 'Search hymns' });
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: 'Mercy' } });

    expect(screen.getByRole('listbox', { name: 'Search suggestions' })).toBeTruthy();
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });

  it('applies and clears theme filters', () => {
    render(<HeritageHymnsDemo initialTab="hymns" />);

    const expected = searchHymns(
      hymnCatalog,
      '',
      { ...createEmptyFilters(), theme: ["Christ's Return"] },
      'title',
    );

    fireEvent.click(screen.getByRole('button', { name: /Christ's Return/ }));

    expect(screen.getByText(`${expected.length} hymns`)).toBeTruthy();
    expect(screen.getByText('1 selected')).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Clear All' })[0]);

    expect(screen.getByText('573 hymns')).toBeTruthy();
  });

  it('toggles theme parent groups without exposing option match counts', () => {
    render(<HeritageHymnsDemo initialTab="hymns" />);

    const group = filterOptions.theme.find((option) => option.label === "God's Perfections");
    const children = group?.children ?? [];
    const expected = searchHymns(
      hymnCatalog,
      '',
      { ...createEmptyFilters(), theme: children },
      'title',
    );

    expect(children.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: "Christ's Return" })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: "God's Perfections" }));

    expect(screen.getByText(`${children.length} selected`)).toBeTruthy();
    expect(screen.getByText(`${expected.length} hymns`)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: "God's Perfections" }));

    expect(screen.queryByText(`${children.length} selected`)).toBeNull();
    expect(screen.getByText('573 hymns')).toBeTruthy();
  });

  it('sorts results by hymn number', () => {
    render(<HeritageHymnsDemo initialTab="hymns" />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort hymns' }), {
      target: { value: 'number' },
    });

    const firstArticle = screen.getAllByRole('article')[0];
    expect(within(firstArticle).getByText('1')).toBeTruthy();
  });

  it('collapses the desktop filter pane from the filter control', () => {
    render(<HeritageHymnsDemo initialTab="hymns" />);

    const button = screen.getByRole('button', { name: 'Filters' });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the mobile filter drawer from the filter control', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        media: '(max-width: 880px)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<HeritageHymnsDemo initialTab="hymns" />);

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeTruthy();
  });

  it('renders About and For Jack tabs with supplied prototype copy', () => {
    const { rerender } = render(<HeritageHymnsDemo initialTab="about" />);

    expect(screen.getByRole('heading', { name: 'Preserving a Legacy of Praise' })).toBeTruthy();
    expect(screen.getByText(/Founded in 2026/)).toBeTruthy();

    rerender(<HeritageHymnsDemo initialTab="for-jack" />);

    expect(screen.getByRole('heading', { name: 'For Jack' })).toBeTruthy();
    expect(screen.getByText(/exactly 573 generated dummy hymn records/)).toBeTruthy();
    expect(screen.getByText(/\$100-\$200\/month figure was meant as a rough active-development/)).toBeTruthy();
    expect(screen.getByText(/Ongoing site costs should mostly be hosting and server costs/)).toBeTruthy();
  });

  it('renders future material icons in their fixed order when available', () => {
    const entry: HymnEntry = {
      id: 'sample-materials',
      number: 901,
      title: 'A Future Hymn',
      firstLine: 'A future hymn begins with a quiet line',
      tuneName: 'FUTURE TUNE',
      meter: 'CM (8 6 8 6)',
      era: '21st Century',
      themes: ['The Reigning King'],
      contributors: [
        { displayName: 'Jane Writer', sortName: 'Writer, Jane', roles: ['words'] },
        { displayName: 'John Composer', sortName: 'Composer, John', roles: ['music'] },
      ],
      copyright: { wordsPublicDomain: true, musicPublicDomain: true },
      materials: { pdf: true, midi: true, congregation: true },
    };

    const { container } = render(<HymnCard result={{ entry, matches: [] }} />);

    const materialKinds = [...container.querySelectorAll('[data-material-kind]')].map((element) =>
      element.getAttribute('data-material-kind'),
    );

    expect(materialKinds).toEqual(['midi', 'congregation', 'pdf']);
    expect(screen.getByLabelText('Words public domain')).toBeTruthy();
    expect(screen.getByLabelText('Music public domain')).toBeTruthy();
  });

  it('collapses identical attributions into Words & Music with independent rights badges', () => {
    const entry: HymnEntry = {
      id: 'sample-collapsed',
      number: 902,
      title: 'A Shared Attribution',
      firstLine: 'A shared attribution sings as one',
      era: '19th Century',
      themes: ['Call to Worship'],
      contributors: [
        { displayName: 'Anne Selby', sortName: 'Selby, Anne', roles: ['words', 'music'] },
      ],
      copyright: { wordsPublicDomain: true, musicPublicDomain: false },
    };

    render(<HymnCard result={{ entry, matches: [] }} />);

    expect(screen.getByText('Words & Music')).toBeTruthy();
    expect(screen.getByLabelText('Words public domain')).toBeTruthy();
    expect(screen.queryByLabelText('Music public domain')).toBeNull();
  });
});
