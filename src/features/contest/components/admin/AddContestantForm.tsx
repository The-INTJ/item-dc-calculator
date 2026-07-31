'use client';

import { useState } from 'react';

function AddContestantLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="admin-entry-add">
      <button type="button" className="button-secondary" onClick={onOpen}>
        Add contestant
      </button>
    </div>
  );
}

/**
 * Collapsed-by-default form for adding a contestant by display name, with a
 * reseed warning when Round 1 is already seeded.
 */
export function AddContestantForm({
  firstRoundSeeded,
  onSubmit,
}: {
  firstRoundSeeded: boolean;
  onSubmit: (displayName: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <AddContestantLauncher
        onOpen={() => {
          setDisplayName('');
          setError(null);
          setOpen(true);
        }}
      />
    );
  }

  const submit = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Display name is required.');
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await onSubmit(trimmed);
    setBusy(false);
    if (!ok) {
      setError('Failed to add contestant.');
      return;
    }
    setOpen(false);
  };

  return (
    <div className="admin-entry-add admin-add-contestant">
      <div className="admin-round-add-matchup__row">
        <input
          className="admin-contestant-input"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Display name"
          aria-label="New contestant display name"
          disabled={busy}
        />
        <button type="button" className="button-primary" onClick={() => void submit()} disabled={busy}>
          Add
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
      {firstRoundSeeded && (
        <p className="admin-detail-meta" role="status">
          Round 1 is already seeded — this contestant won&apos;t appear in any matchup until you
          reseed Round 1 or add a matchup manually.
        </p>
      )}
      {error && (
        <p className="admin-round-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
