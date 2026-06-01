'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import { buildExportText } from '../lib/format';
import type { Plant } from '../lib/types';
import { PlantCard } from './PlantCard';
import styles from './PlantsView.module.scss';

export function PlantsView() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    plantsApi.list().then((result) => {
      if (!active) {
        return;
      }
      if (result.success) {
        setPlants(result.data ?? []);
        setLoadError(null);
      } else {
        setLoadError(result.error ?? 'Could not load your plants.');
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!exportOpen) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setExportOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exportOpen]);

  async function submitAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setAddError('Give your plant a name.');
      return;
    }
    setAddBusy(true);
    setAddError(null);
    const result = await plantsApi.create(trimmed);
    setAddBusy(false);
    if (result.success && result.data) {
      const created = result.data;
      setPlants((current) => [...current, created]);
      setNameDraft('');
      setAddOpen(false);
    } else {
      setAddError(result.error ?? 'Could not add the plant.');
    }
  }

  function handleChanged(updated: Plant) {
    setPlants((current) => current.map((plant) => (plant.id === updated.id ? updated : plant)));
  }

  function handleRemoved(id: string) {
    setPlants((current) => current.filter((plant) => plant.id !== id));
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(buildExportText(plants, Date.now()));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const exportText = exportOpen ? buildExportText(plants, Date.now()) : '';

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link href="/" className={styles.backLink}>
          ← Experiments
        </Link>
      </div>

      <header className={styles.head}>
        <h1 className={styles.title}>Plant tracker</h1>
        <p className={styles.tagline}>
          Log watering, fertilizer, notes, vibe checks and replanting. Tap a plant to open its
          history and trends.
        </p>
      </header>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setAddOpen((value) => !value)}
        >
          {addOpen ? 'Close' : '+ Add plant'}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            setCopied(false);
            setExportOpen(true);
          }}
          disabled={plants.length === 0}
        >
          Export
        </button>
      </div>

      {addOpen && (
        <form className={styles.addForm} onSubmit={submitAdd}>
          <input
            className={styles.addInput}
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            placeholder="Plant name (e.g. Monstera by the window)"
            maxLength={80}
            autoFocus
            aria-label="New plant name"
          />
          <button
            type="submit"
            className={`${styles.formButton} ${styles.formButtonPrimary}`}
            disabled={addBusy}
          >
            {addBusy ? 'Adding…' : 'Add'}
          </button>
          <button
            type="button"
            className={styles.formButton}
            onClick={() => {
              setAddOpen(false);
              setAddError(null);
              setNameDraft('');
            }}
          >
            Cancel
          </button>
          {addError && <p className={styles.addError}>{addError}</p>}
        </form>
      )}

      {loading && <div className={styles.state}>Loading your plants…</div>}

      {!loading && loadError && (
        <div className={styles.state}>
          <span>{loadError}</span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !loadError && plants.length === 0 && (
        <div className={styles.state}>
          No plants yet. Add your first one to start tracking its care.
        </div>
      )}

      {!loading && !loadError && plants.length > 0 && (
        <div className={styles.list}>
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onChanged={handleChanged}
              onRemoved={handleRemoved}
            />
          ))}
        </div>
      )}

      {exportOpen && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => setExportOpen(false)}
        >
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
                onClick={() => setExportOpen(false)}
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
      )}
    </div>
  );
}
