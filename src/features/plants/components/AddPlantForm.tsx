'use client';

import { useState, type FormEvent } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import type { Plant } from '../lib/types';
import styles from './PlantsView.module.scss';

interface AddPlantFormProps {
  open: boolean;
  onCreated: (plant: Plant) => void;
  onCancel: () => void;
}

/**
 * Stays mounted while hidden so an in-progress draft (and any error) survives
 * closing and reopening the form via the toolbar toggle — matching the
 * original inline-form behavior where this state lived in PlantsView.
 */
export function AddPlantForm({ open, onCreated, onCancel }: AddPlantFormProps) {
  const [nameDraft, setNameDraft] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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
      setNameDraft('');
      onCreated(created);
    } else {
      setAddError(result.error ?? 'Could not add the plant.');
    }
  }

  if (!open) {
    return null;
  }

  return (
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
          onCancel();
          setAddError(null);
          setNameDraft('');
        }}
      >
        Cancel
      </button>
      {addError && <p className={styles.addError}>{addError}</p>}
    </form>
  );
}
