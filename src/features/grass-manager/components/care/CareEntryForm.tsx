'use client';

import { useState } from 'react';
import type { CareEvent, GrassProfile } from '../../lib/types';
import { eventLabel } from '../../lib/storage';
import { segmentName } from '../../lib/yard';
import styles from '../GrassManagerView.module.scss';

interface Props {
  type: CareEvent['type']; scope: string; today: string; profile: GrassProfile;
  onAdd: (event: Omit<CareEvent, 'id'>) => void; onCancel: () => void;
}

export function CareEntryForm({ type, scope, today, profile, onAdd, onCancel }: Props) {
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(String(profile.sprinklerMinutes));
  const [product, setProduct] = useState('');
  const [note, setNote] = useState('');
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (date > today || !date) return;
    onAdd({ type, at: date, segmentId: scope,
      minutes: type === 'watered' ? Number(minutes) : undefined,
      product: product.trim() || undefined, note: note.trim() || undefined,
    });
  }
  return (
    <form className={styles.careForm} onSubmit={submit} aria-label={`Log ${eventLabel(type)} for ${segmentName(scope)}`}>
      <strong>{eventLabel(type)} · {segmentName(scope)}</strong>
      <label className={styles.field}>Date<input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} required /></label>
      {type === 'watered' && <label className={styles.field}>Minutes per sprinkler position<input type="number" min="1" max="180" value={minutes} onChange={(event) => setMinutes(event.target.value)} required /></label>}
      {(type === 'fertilized' || type === 'weed-control') && <label className={styles.field}>Product (optional)<input maxLength={120} value={product} onChange={(event) => setProduct(event.target.value)} placeholder="Product name from the label" /></label>}
      <label className={styles.field}>Note (optional)<input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <div className={styles.buttonRow}><button className={styles.primaryButton} type="submit">Save for {segmentName(scope).toLowerCase()}</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}
