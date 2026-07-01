import { describe, expect, it } from 'vitest';
import { getHeritageTabHref, normalizeHeritageTab } from './tabs';

describe('heritage tab helpers', () => {
  it('defaults empty and invalid tab values to home', () => {
    expect(normalizeHeritageTab(undefined)).toBe('home');
    expect(normalizeHeritageTab(null)).toBe('home');
    expect(normalizeHeritageTab('not-real')).toBe('home');
    expect(normalizeHeritageTab('for-jack')).toBe('home');
  });

  it('normalizes known tab values', () => {
    expect(normalizeHeritageTab('hymns')).toBe('hymns');
    expect(normalizeHeritageTab(['about'])).toBe('about');
  });

  it('builds canonical Heritage hrefs', () => {
    expect(getHeritageTabHref('home')).toBe('/heritage-hymns');
    expect(getHeritageTabHref('hymns')).toBe('/heritage-hymns?tab=hymns');
  });
});
