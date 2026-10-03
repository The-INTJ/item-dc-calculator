'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

import styles from './Sheet.module.scss';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A modal built on the native <dialog>: focus is trapped and restored by the
 * browser, and Escape closes it.
 */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={styles.sheet} aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children}
    </dialog>
  );
}

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({ open, title, body, confirmLabel, danger, onConfirm, onCancel }: ConfirmSheetProps) {
  return (
    <Sheet open={open} title={title} onClose={onCancel}>
      <p className={styles.body}>{body}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.quiet} onClick={onCancel}>
          Go back
        </button>
        <button type="button" className={danger ? styles.danger : styles.primary} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
