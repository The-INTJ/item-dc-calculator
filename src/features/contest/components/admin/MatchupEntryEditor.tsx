'use client';

import { useState } from 'react';
import type { Entry, Matchup } from '../../contexts/contest/contestTypes';

/**
 * Inline editor for a single matchup entry's name (commits on blur).
 */
export function MatchupEntryEditor({
  matchup,
  entry,
  roundLabel,
  onSubmit,
}: {
  matchup: Matchup;
  entry: Entry;
  roundLabel: string;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(entry.name ?? '');
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    const trimmed = draft.trim();
    if (trimmed === (entry.name?.trim() ?? '')) return;
    if (!trimmed) return;
    setBusy(true);
    await onSubmit(trimmed);
    setBusy(false);
  };

  return (
    <li className="admin-entry-row">
      <input
        className="admin-contestant-input admin-entry-row__name"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        placeholder="Entry name (e.g. drink name)"
        disabled={busy}
      />
      <span className="admin-entry-row__placement">
        {roundLabel} · Matchup {matchup.slotIndex + 1}
      </span>
    </li>
  );
}
