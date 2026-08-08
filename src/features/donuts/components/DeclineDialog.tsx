'use client';

import { useState } from 'react';

import styles from './DonutsView.module.scss';
import { DonutDialog } from './DonutDialog';

interface DeclineDialogProps {
  personName: string;
  busy: boolean;
  error: string | null;
  onConfirm: (reason: string | undefined) => void;
  onCancel: () => void;
}

/** "I cannot do it" — the reason is genuinely optional; the swap is not. */
export function DeclineDialog({
  personName,
  busy,
  error,
  onConfirm,
  onCancel,
}: DeclineDialogProps) {
  const [reason, setReason] = useState('');

  return (
    <DonutDialog
      title="Can't make it?"
      hint={`We'll pass this Sunday from ${personName} to whoever has gone longest without a turn.`}
      submitLabel="Pass it on"
      busy={busy}
      error={error}
      onSubmit={() => onConfirm(reason.trim() || undefined)}
      onCancel={onCancel}
    >
      <label className={styles.field}>
        Reason (optional)
        <input
          className={styles.input}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Out of town, sick kid, …"
          maxLength={300}
          autoFocus
        />
      </label>
    </DonutDialog>
  );
}
