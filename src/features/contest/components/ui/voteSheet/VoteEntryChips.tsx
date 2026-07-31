'use client';

import type { EntrySummary } from '../../../lib/presentation/uiMappings';

interface VoteEntryChipsProps {
  entries: EntrySummary[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Numbered chips for jumping between the entries on this matchup. */
export function VoteEntryChips({ entries, activeIndex, onSelect }: VoteEntryChipsProps) {
  return (
    <nav className="vote-sheet__entry-chips" aria-label="Entries">
      {entries.map((entry, index) => (
        <button
          key={entry.id}
          type="button"
          className={`vote-sheet__entry-chip${index === activeIndex ? ' vote-sheet__entry-chip--active' : ''}`}
          onClick={() => onSelect(index)}
        >
          {index + 1}. {entry.name ?? entry.creatorName}
        </button>
      ))}
    </nav>
  );
}
