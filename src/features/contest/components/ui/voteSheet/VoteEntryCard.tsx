'use client';

import type { EntrySummary } from '../../../lib/presentation/uiMappings';

interface VoteEntryCardProps {
  entry: EntrySummary;
  isSelfEntry: boolean;
}

/** The entry currently being scored, with its creator credited. */
export function VoteEntryCard({ entry, isSelfEntry }: VoteEntryCardProps) {
  return (
    <section className="vote-sheet__entry-card">
      <span className="vote-sheet__entry-art" aria-hidden="true" />
      <span className="vote-sheet__entry-copy">
        <strong>{entry.displayName}</strong>
        <span>
          by {entry.creatorName}
          {isSelfEntry && <em className="vote-sheet__self-badge"> · Your entry</em>}
        </span>
      </span>
    </section>
  );
}
