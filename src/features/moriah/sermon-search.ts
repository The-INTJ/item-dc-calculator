import type { Sermon } from './content';

/**
 * Search and filter behavior for the sermon library, kept pure so the
 * client component stays presentational.
 *
 * There is no date sort here because the preview's entries carry no dates —
 * see content.ts. When real recordings arrive with dates, add the field and
 * the order back; nothing else in this module has to change.
 */

export type SortOrder = 'a-z' | 'z-a';

export interface SermonQuery {
  text: string;
  book: string | null;
  order: SortOrder;
}

/** Fields a free-text query matches against, in the order a reader would expect. */
function haystack(sermon: Sermon): string {
  return [sermon.title, sermon.scripture, sermon.book, sermon.summary]
    .join(' ~ ')
    .toLowerCase();
}

/**
 * Every whitespace-separated term must appear somewhere in the record, so
 * "romans election" narrows rather than widens. Matching is substring-based:
 * a search for "john" finds both "John 19:30" and "1 John 5:7", which is what
 * someone hunting for a passage expects.
 */
function matchesText(sermon: Sermon, text: string): boolean {
  const terms = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const target = haystack(sermon);
  return terms.every((term) => target.includes(term));
}

export function filterSermons(sermons: Sermon[], query: SermonQuery): Sermon[] {
  const matched = sermons.filter(
    (sermon) =>
      matchesText(sermon, query.text) && (query.book === null || sermon.book === query.book),
  );

  return matched.sort((a, b) =>
    query.order === 'a-z' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title),
  );
}

/** Distinct values for a facet, in first-seen order. */
export function facetValues(sermons: Sermon[], key: 'book'): string[] {
  return [...new Set(sermons.map((sermon) => sermon[key]))];
}

export interface TextSegment {
  text: string;
  matched: boolean;
}

/**
 * Splits a string into matched/unmatched runs so results can highlight what
 * the reader typed. Terms are escaped before they reach the RegExp, and an
 * all-punctuation query degrades to a single unmatched segment.
 */
export function highlight(value: string, text: string): TextSegment[] {
  const terms = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [{ text: value, matched: false }];

  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const termSet = new Set(terms);

  // String.split with a capturing group keeps the delimiters, so every part
  // that equals a term (case-insensitively) is a match — no stateful .test().
  return value
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, matched: termSet.has(part.toLowerCase()) }));
}
