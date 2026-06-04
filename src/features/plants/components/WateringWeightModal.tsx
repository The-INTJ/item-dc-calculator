'use client';

import { useEffect, useState, type FormEvent } from 'react';

import type { WateringWeightInput } from '../lib/types';
import styles from './WateringWeightModal.module.scss';

interface WateringWeightModalProps {
  title: string;
  initialBefore?: string;
  initialAfter?: string;
  error?: string | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (weights: WateringWeightInput) => void | Promise<void>;
}

function cleanWeight(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function WateringWeightModal({
  title,
  initialBefore = '',
  initialAfter = '',
  error = null,
  saving = false,
  onClose,
  onSubmit,
}: WateringWeightModalProps) {
  const [weightBefore, setWeightBefore] = useState(initialBefore);
  const [weightAfter, setWeightAfter] = useState(initialAfter);

  useEffect(() => {
    setWeightBefore(initialBefore);
    setWeightAfter(initialAfter);
  }, [initialBefore, initialAfter]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      weightBefore: cleanWeight(weightBefore),
      weightAfter: cleanWeight(weightAfter),
    });
  }

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <form
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close watering weights dialog"
            disabled={saving}
          >
            x
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Before</span>
            <input
              className={styles.input}
              value={weightBefore}
              onChange={(event) => setWeightBefore(event.target.value)}
              placeholder="e.g. 410 g"
              maxLength={80}
              autoFocus
              disabled={saving}
            />
          </label>
          <label className={styles.field}>
            <span>After</span>
            <input
              className={styles.input}
              value={weightAfter}
              onChange={(event) => setWeightAfter(event.target.value)}
              placeholder="e.g. 690 g"
              maxLength={80}
              disabled={saving}
            />
          </label>
          <button
            type="submit"
            className={styles.check}
            aria-label="Save watering weights"
            disabled={saving}
          >
            {saving ? '...' : '✓'}
          </button>
        </div>
      </form>
    </div>
  );
}
