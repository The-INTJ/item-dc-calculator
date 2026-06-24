import type { ReactNode } from 'react';
import type { SearchMatch } from '../lib/types';

export function matchesFor(matches: SearchMatch[], field: SearchMatch['field'], value: string): SearchMatch[] {
  return matches.filter((match) => match.field === field && match.value === value);
}

export function HighlightedText({ value, matches }: { value: string; matches: SearchMatch[] }) {
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
