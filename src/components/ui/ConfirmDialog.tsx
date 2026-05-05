'use client';

import type { ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    void onConfirm();
  };

  return (
    <div className="auth-modal-backdrop" onClick={onCancel}>
      <div className="auth-modal confirm-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-modal__actions">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
