import { describe, expect, it } from 'vitest';
import { hymnCatalog } from './catalog';
import { buildSearchSuggestions } from './suggestions';

describe('heritage search suggestions', () => {
  it('returns local suggestions across hymn fields', () => {
    const suggestions = buildSearchSuggestions(hymnCatalog, 'Mercy');

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((suggestion) => suggestion.field === 'Title')).toBe(true);
  });

  it('returns numeric suggestions for hymn numbers', () => {
    const suggestions = buildSearchSuggestions(hymnCatalog, '227');

    expect(suggestions[0]).toMatchObject({
      field: 'Number',
      value: '227',
      completion: '227',
    });
  });

  it('limits suggestions and returns none for blank queries', () => {
    expect(buildSearchSuggestions(hymnCatalog, '')).toEqual([]);
    expect(buildSearchSuggestions(hymnCatalog, 'the')).toHaveLength(7);
  });
});
