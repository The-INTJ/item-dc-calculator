'use client';

import { useState } from 'react';
import { GRASS_LABELS } from '../lib/lawnCare';
import type { GrassProfile } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface Props { profile: GrassProfile; onSave: (patch: Partial<GrassProfile>) => void; onCancel?: () => void }

export function GrassProfileForm({ profile, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState(profile);
  const [weeds, setWeeds] = useState(profile.weedTypes.join(', '));
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const weedTypes = [...new Set(weeds.split(',').map((weed) => weed.trim().toLowerCase().slice(0, 80)).filter(Boolean))].slice(0, 8);
    const { grassType, lawnStage, weedCoverage, sprinklerMinutes, sprinklerInches } = draft;
    onSave({ grassType, lawnStage, weedCoverage, sprinklerMinutes, sprinklerInches, weedTypes, configured: true });
  }
  return (
    <form className={styles.profileForm} onSubmit={submit} aria-label="Lawn profile">
      <label className={styles.field}>Grass type<select value={draft.grassType} onChange={(event) => setDraft({ ...draft, grassType: event.target.value as GrassProfile['grassType'] })}>
        {Object.entries(GRASS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className={styles.field}>Lawn stage<select value={draft.lawnStage} onChange={(event) => setDraft({ ...draft, lawnStage: event.target.value as GrassProfile['lawnStage'] })}>
        <option value="established">Established grass</option><option value="seeding">Planning to seed</option><option value="new-seed">New seed / seedlings</option><option value="dormant">Dormant lawn</option>
      </select></label>
      <label className={`${styles.field} ${styles.wideField}`}>Weeds · comma separated<input maxLength={300} value={weeds} onChange={(event) => setWeeds(event.target.value)} placeholder="dandelion, crabgrass, clover…" /></label>
      <label className={styles.field}>How much?<select value={draft.weedCoverage} onChange={(event) => setDraft({ ...draft, weedCoverage: event.target.value as GrassProfile['weedCoverage'] })}>
        <option value="scattered">A few scattered weeds</option><option value="patches">Recurring patches</option><option value="widespread">Much of the lawn</option>
      </select></label>
      <details className={`${styles.subDetails} ${styles.wideField}`}><summary>Sprinkler calibration (optional)</summary>
        <p>Measure average depth in straight-sided cups across one sprinkler position.</p>
        <div className={styles.formPair}>
          <label className={styles.field}>Test run · minutes<input type="number" min="1" max="180" value={draft.sprinklerMinutes} onChange={(event) => setDraft({ ...draft, sprinklerMinutes: Number(event.target.value) })} required /></label>
          <label className={styles.field}>Measured depth · inches<input type="number" min="0.01" max="3" step="0.01" value={draft.sprinklerInches ?? ''} placeholder="Not measured" onChange={(event) => setDraft({ ...draft, sprinklerInches: event.target.value ? Number(event.target.value) : undefined })} /></label>
        </div>
      </details>
      <div className={`${styles.buttonRow} ${styles.wideField}`}><button type="submit" className={styles.primaryButton}>Save lawn profile</button>{onCancel && <button type="button" onClick={onCancel}>Cancel</button>}</div>
    </form>
  );
}
