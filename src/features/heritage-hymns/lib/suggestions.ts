import type { HymnEntry } from './types';

export interface SearchSuggestion {
  id: string;
  field: 'Number' | 'Title' | 'First Line' | 'Chorus' | 'Tune' | 'Contributor';
  value: string;
  completion: string;
}

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

export function buildSearchSuggestions(entries: HymnEntry[], query: string): SearchSuggestion[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (normalizedQuery.length === 0) return [];

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
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
