'use client';

import type { FormEvent, ReactNode } from 'react';

import styles from './DonutsView.module.scss';

interface DonutDialogProps {
  title: string;
  hint?: string;
  submitLabel: string;
  submitDisabled?: boolean;
  busy?: boolean;
  error?: string | null;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}

/** Shared chrome for the two small prompts the main page can raise. */
export function DonutDialog({
  title,
  hint,
  submitLabel,
  submitDisabled,
  busy,
  error,
  onSubmit,
  onCancel,
  children,
}: DonutDialogProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title}>
      <form className={styles.dialog} onSubmit={handleSubmit}>
        <h2 className={styles.dialogTitle}>{title}</h2>
        {hint && <p className={styles.dialogHint}>{hint}</p>}
        {children}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.dialogButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className={`${styles.dialogButton} ${styles.dialogButtonPrimary}`}
            disabled={busy || submitDisabled}
          >
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
