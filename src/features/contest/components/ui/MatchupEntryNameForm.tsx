'use client';

import { useState } from 'react';
import type { Contest, Entry, Matchup } from '../../contexts/contest/contestTypes';
import { useContestStore } from '../../contexts/contest/ContestContext';
import { getContestantById } from '../../lib/domain/matchupGetters';
import { getRoundLabel } from '../../lib/domain/contestGetters';

interface MatchupEntryNameFormProps {
  contest: Contest;
  matchup: Matchup;
  entry: Entry;
}

export function MatchupEntryNameForm({ contest, matchup, entry }: MatchupEntryNameFormProps) {
  const { setMatchupEntryName } = useContestStore();
  const [draft, setDraft] = useState(entry.name ?? '');
  const [description, setDescription] = useState(entry.description ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const opponent = matchup.entries.find((e) => e.id !== entry.id) ?? null;
  const opponentName =
    (opponent && getContestantById(contest, opponent.contestantId)?.displayName) ?? 'TBD';
  const roundLabel = getRoundLabel(contest, matchup.roundId);
  const matchupNumber = matchup.slotIndex + 1;
  const entryLabel = contest.config?.entryLabel ?? 'entry';

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setMessage('Name is required.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await setMatchupEntryName(contest.id, matchup.id, entry.id, {
      name: trimmed,
      description: description.trim() || undefined,
    });
    setBusy(false);
    if (!result) {
      setMessage('Could not save — please try again.');
      return;
    }
    setMessage('Saved!');
  };

  return (
    <div className="matchup-entry-form" aria-label={`Your ${entryLabel} for matchup ${matchupNumber}`}>
      <header className="matchup-entry-form__header">
        <p className="eyebrow">{roundLabel} · Matchup {matchupNumber}</p>
        <h3>You're facing {opponentName} — what's your {entryLabel.toLowerCase()} called?</h3>
      </header>
      <label className="matchup-entry-form__label">
        <span>{entryLabel} name</span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`e.g. ${entryLabel === 'Drink' ? 'Summer Sunset' : 'My creation'}`}
          maxLength={80}
          disabled={busy}
        />
      </label>
      <label className="matchup-entry-form__label">
        <span>Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
          rows={2}
          disabled={busy}
        />
      </label>
      <div className="matchup-entry-form__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void submit()}
          disabled={busy}
        >
          {busy ? 'Saving...' : entry.name?.trim() ? 'Update' : 'Submit'}
        </button>
      </div>
      {message && <p className="matchup-entry-form__message">{message}</p>}
    </div>
  );
}
