'use client';

import { useEffect } from 'react';
import { content } from '../../content';
import { listFixtureSummaries } from '../../fixtures/registry';
import { contextLabel } from '../shared/format';
import styles from './NextFragmentChooser.module.scss';

interface NextFragmentChooserProps {
  open: boolean;
  onClose: () => void;
  onPick: (choice: { kind: 'fixture'; fixtureId: string } | { kind: 'blank' }) => void;
}

/**
 * Post-apply chooser (self-contained modal, plants-feature pattern): pick the
 * next sample fragment or start from a blank tonic note, keeping the applied
 * harmony as the accepted context. Dismissible — keep working on the applied
 * fragment instead.
 */
export function NextFragmentChooser({ open, onClose, onPick }: NextFragmentChooserProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={content.nextFragment.heading}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className={styles.heading}>{content.nextFragment.heading}</h3>
        <p className={styles.hint}>{content.nextFragment.hint}</p>
        <div className={styles.options}>
          {listFixtureSummaries().map((summary) => (
            <button
              key={summary.id}
              type="button"
              className={styles.option}
              onClick={() => onPick({ kind: 'fixture', fixtureId: summary.id })}
            >
              {summary.name} · {contextLabel(summary.tonalContext)}
            </button>
          ))}
          <button
            type="button"
            className={styles.option}
            onClick={() => onPick({ kind: 'blank' })}
          >
            {content.nextFragment.blank}
          </button>
        </div>
        <button type="button" className={styles.dismiss} onClick={onClose}>
          {content.nextFragment.dismiss}
        </button>
      </div>
    </div>
  );
}
