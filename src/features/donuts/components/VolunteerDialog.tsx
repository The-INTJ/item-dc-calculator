'use client';

import { useState } from 'react';

import type { DonutPerson } from '../lib/types';

import styles from './DonutsView.module.scss';
import { DonutDialog } from './DonutDialog';

interface VolunteerDialogProps {
  people: DonutPerson[];
  busy: boolean;
  error: string | null;
  onConfirm: (personId: string) => void;
  onCancel: () => void;
}

/** "I can do it" — a name is required, so the dialog starts with none chosen. */
export function VolunteerDialog({
  people,
  busy,
  error,
  onConfirm,
  onCancel,
}: VolunteerDialogProps) {
  const [personId, setPersonId] = useState('');

  return (
    <DonutDialog
      title="Who's bringing them?"
      hint="Pick a name and this Sunday is theirs."
      submitLabel="Assign"
      submitDisabled={personId === ''}
      busy={busy}
      error={error}
      onSubmit={() => personId && onConfirm(personId)}
      onCancel={onCancel}
    >
      <label className={styles.field}>
        Name
        <select
          className={styles.select}
          value={personId}
          onChange={(event) => setPersonId(event.target.value)}
          autoFocus
        >
          <option value="">Choose someone…</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
    </DonutDialog>
  );
}
