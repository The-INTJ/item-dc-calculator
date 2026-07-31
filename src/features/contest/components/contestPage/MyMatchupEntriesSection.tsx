'use client';

import type { Contest } from '../../contexts/contest/contestTypes';
import type { MyMatchupEntry } from '../../lib/hooks/useMyMatchupEntries';
import { MatchupEntryNameForm } from '../ui/MatchupEntryNameForm';

interface MyMatchupEntriesSectionProps {
  contest: Contest;
  entries: MyMatchupEntry[];
  pendingEntryCount: number;
  entryLabel: string;
}

/**
 * Where a contestant names what they brought to each matchup. The banner is
 * separate from the list because the list can sit well below the fold.
 */
export function MyMatchupEntriesSection({
  contest,
  entries,
  pendingEntryCount,
  entryLabel,
}: MyMatchupEntriesSectionProps) {
  const lower = entryLabel.toLowerCase();

  return (
    <>
      {pendingEntryCount > 0 && (
        <aside className="matchup-entry-banner" role="status">
          <strong>
            {pendingEntryCount === 1
              ? `1 ${lower} needs a name.`
              : `${pendingEntryCount} ${lower}s need names.`}
          </strong>
          <span>Scroll down to fill in your matchup entries.</span>
        </aside>
      )}

      {entries.length > 0 && (
        <section className="matchup-entry-section" aria-label="Your matchup entries">
          <h2>Your matchup {entries.length === 1 ? lower : `${lower}s`}</h2>
          <div className="matchup-entry-section__list">
            {entries.map(({ matchup, entry }) => (
              <MatchupEntryNameForm
                key={entry.id}
                contest={contest}
                matchup={matchup}
                entry={entry}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
