'use client';

import { useState } from 'react';
import type { Contestant, Matchup, MatchupPhase } from '../../contexts/contest/contestTypes';

interface AddMatchupInput {
  slotIndex: number;
  contestantIds: string[];
  phase?: MatchupPhase;
  winnerEntryId?: string | null;
}

interface AddMatchupFormProps {
  contestants: Contestant[];
  nextSlotIndex: number;
  onSubmit: (input: AddMatchupInput) => Promise<Matchup | null>;
}

function validateMatchupSelection(
  contestantA: string,
  contestantB: string,
  isBye: boolean,
): string | null {
  if (!contestantA) return 'Contestant A is required.';
  if (!isBye && !contestantB) return 'Pick a second contestant, or check "Bye".';
  if (!isBye && contestantA === contestantB) return 'Contestants must be different.';
  return null;
}

/**
 * Draft state for a manually created matchup: contestant picks, bye flag, submission.
 */
function useAddMatchupDraft(
  nextSlotIndex: number,
  onSubmit: (input: AddMatchupInput) => Promise<Matchup | null>,
) {
  const [open, setOpen] = useState(false);
  const [contestantA, setContestantA] = useState('');
  const [contestantB, setContestantB] = useState('');
  const [isBye, setIsBye] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const openForm = () => {
    setContestantA('');
    setContestantB('');
    setIsBye(false);
    setError(null);
    setOpen(true);
  };

  const cancel = () => {
    setOpen(false);
    setError(null);
  };

  const toggleBye = (checked: boolean) => {
    setIsBye(checked);
    if (checked) setContestantB('');
  };

  const submit = async () => {
    const validationError = validateMatchupSelection(contestantA, contestantB, isBye);
    setError(validationError);
    if (validationError) return;
    setIsBusy(true);
    try {
      const result = isBye
        ? await onSubmit({
            slotIndex: nextSlotIndex,
            contestantIds: [contestantA],
            phase: 'scored',
          })
        : await onSubmit({
            slotIndex: nextSlotIndex,
            contestantIds: [contestantA, contestantB],
            phase: 'set',
          });
      if (!result) {
        setError('Failed to create matchup.');
        return;
      }
      setOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  return {
    open,
    openForm,
    cancel,
    contestantA,
    setContestantA,
    contestantB,
    setContestantB,
    isBye,
    toggleBye,
    error,
    isBusy,
    submit,
  };
}

function ContestantSelect({
  value,
  onChange,
  contestants,
  disabled,
}: {
  value: string;
  onChange: (contestantId: string) => void;
  contestants: Contestant[];
  disabled: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      <option value="">— Select contestant —</option>
      {contestants.map((c) => (
        <option key={c.id} value={c.id}>
          {c.displayName}
        </option>
      ))}
    </select>
  );
}

export function AddMatchupForm({ contestants, nextSlotIndex, onSubmit }: AddMatchupFormProps) {
  const draft = useAddMatchupDraft(nextSlotIndex, onSubmit);

  if (!draft.open) {
    return (
      <div className="admin-round-add-matchup">
        <button
          type="button"
          className="button-secondary"
          onClick={draft.openForm}
          disabled={contestants.length === 0}
        >
          Add matchup
        </button>
      </div>
    );
  }

  return (
    <div className="admin-round-add-matchup admin-round-add-matchup--open">
      <div className="admin-round-add-matchup__row">
        <ContestantSelect
          value={draft.contestantA}
          onChange={draft.setContestantA}
          contestants={contestants}
          disabled={draft.isBusy}
        />
        <span className="admin-round-entry__vs">vs</span>
        <ContestantSelect
          value={draft.contestantB}
          onChange={draft.setContestantB}
          contestants={contestants}
          disabled={draft.isBusy || draft.isBye}
        />
      </div>
      <label className="admin-round-add-matchup__bye">
        <input
          type="checkbox"
          checked={draft.isBye}
          onChange={(e) => draft.toggleBye(e.target.checked)}
          disabled={draft.isBusy}
        />
        Bye / auto-advance
      </label>
      {draft.error && (
        <p className="admin-round-error" role="alert">
          {draft.error}
        </p>
      )}
      <div className="admin-round-add-matchup__actions">
        <button
          type="button"
          className="button-primary"
          onClick={() => void draft.submit()}
          disabled={draft.isBusy}
        >
          Create
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={draft.cancel}
          disabled={draft.isBusy}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
