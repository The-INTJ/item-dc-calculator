import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hymnCatalog } from '../lib/catalog';
import { createEmptyFilters, searchHymns } from '../lib/search';
import { HeritageHymnsDemo } from './HeritageHymnsDemo';

describe('HeritageHymnsDemo', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens on the full dummy collection', () => {
    render(<HeritageHymnsDemo />);

    expect(screen.getByText('573 hymns')).toBeTruthy();
    expect(screen.getByRole('searchbox', { name: 'Search hymns' })).toBeTruthy();
    expect(screen.getAllByText('Words').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Dev display toggle')).toBeNull();
  });

  it('updates the count and highlights matches while typing', () => {
    render(<HeritageHymnsDemo />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search hymns' }), {
      target: { value: 'Waters' },
    });

    expect(screen.getByText('1 hymn')).toBeTruthy();
    expect(screen.getAllByText('Waters').length).toBeGreaterThan(0);
  });

  it('shows local search suggestions while typing', () => {
    render(<HeritageHymnsDemo />);

    const search = screen.getByRole('searchbox', { name: 'Search hymns' });
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: 'Mercy' } });

    expect(screen.getByRole('listbox', { name: 'Search suggestions' })).toBeTruthy();
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
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

    fireEvent.click(screen.getByRole('button', { name: 'Number' }));

    const firstArticle = screen.getAllByRole('article')[0];
    expect(within(firstArticle).getByText('1')).toBeTruthy();
  });

  it('collapses the desktop filter pane from the filter control', () => {
    render(<HeritageHymnsDemo />);

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

    render(<HeritageHymnsDemo />);

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeTruthy();
  });
});
