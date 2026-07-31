'use client';

import { useEffect, useState } from 'react';

import { buildExportText } from '../lib/format';
import type { Plant } from '../lib/types';
import styles from './PlantsView.module.scss';

interface PlantExportModalProps {
  plants: Plant[];
  onClose: () => void;
}

export function PlantExportModal({ plants, onClose }: PlantExportModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(buildExportText(plants, Date.now()));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const exportText = buildExportText(plants, Date.now());

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Export plant data"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>Export plant data</h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close export dialog"
          >
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <textarea
            className={styles.exportArea}
            value={exportText}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
          <p className={styles.modalHint}>
            Paste this into an AI for analysis, or fetch it directly:{' '}
            <code>/api/plants/export?format=text</code> for this digest, or{' '}
            <code>/api/plants/export</code> for full JSON.
          </p>
          <div className={styles.modalActions}>
            <button type="button" className={styles.copyButton} onClick={copyExport}>
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
