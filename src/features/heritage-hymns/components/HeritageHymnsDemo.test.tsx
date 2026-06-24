import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { hymnCatalog } from '../lib/catalog';
import { createEmptyFilters, searchHymns } from '../lib/search';
import { HeritageHymnsDemo } from './HeritageHymnsDemo';

describe('HeritageHymnsDemo', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens on the full dummy collection', () => {
    render(<HeritageHymnsDemo />);

    expect(screen.getByText('573 hymns')).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: 'Search hymns' })).toBeTruthy();
  });

  it('updates the count and highlights matches while typing', () => {
    render(<HeritageHymnsDemo />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search hymns' }), {
      target: { value: 'Waters' },
    });

    expect(screen.getByText('1 hymn')).toBeTruthy();
    expect(screen.getAllByText('Waters').length).toBeGreaterThan(0);
  });

  it('applies and clears theme filters', () => {
    render(<HeritageHymnsDemo />);

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

  it('sorts results by hymn number', () => {
    render(<HeritageHymnsDemo />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort by' }), {
      target: { value: 'number' },
    });

    const firstArticle = screen.getAllByRole('article')[0];
    expect(within(firstArticle).getByText('1')).toBeTruthy();
  });

  it('opens the mobile filter drawer from the filter control', () => {
    render(<HeritageHymnsDemo />);

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeTruthy();
  });
});
