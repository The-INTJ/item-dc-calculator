'use client';

import { useState } from 'react';

import { eventLabel, todayInputValue } from '../lib/storage';
import type { CareEvent, YardSegment } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface CareLogPanelProps {
  events: CareEvent[];
  selectedSegment: YardSegment;
  onAdd: (event: Omit<CareEvent, 'id'>) => void;
  onRemove: (id: string) => void;
}

export function CareLogPanel({ events, selectedSegment, onAdd, onRemove }: CareLogPanelProps) {
  const [type, setType] = useState<CareEvent['type']>('watered');
  const [date, setDate] = useState(todayInputValue);
  const [minutes, setMinutes] = useState('20');
  const [product, setProduct] = useState('');
  const [note, setNote] = useState('');

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd({
      type,
      at: date,
      segmentId: selectedSegment.id,
      minutes: type === 'watered' ? Number(minutes) || undefined : undefined,
      product: type === 'weed-control' ? product.trim() || undefined : undefined,
      note: note.trim() || undefined,
    });
    setNote('');
    setProduct('');
  }

  return (
    <section className={styles.careCard}>
      <div className={styles.cardHeading}><div><span className={styles.eyebrow}>Care log</span><h2>Keep the lawn’s memory</h2></div><span className={styles.mapKey}>{selectedSegment.shortName}</span></div>
      <p className={styles.sectionIntro}>Log what happened in the selected zone. The recommendation changes when the manager knows you already watered, fed, or sprayed.</p>
      <form className={styles.careForm} onSubmit={submit}>
        <label className={styles.field}><span>Action</span><select value={type} onChange={(event) => setType(event.target.value as CareEvent['type'])}><option value="watered">Watered</option><option value="fertilized">Fertilized</option><option value="weed-control">Weed chemical / control</option></select></label>
        <label className={styles.field}><span>Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        {type === 'watered' && <label className={styles.field}><span>Minutes in this zone</span><input type="number" min="1" max="180" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label>}
        {type === 'weed-control' && <label className={styles.field}><span>Product or method</span><input value={product} onChange={(event) => setProduct(event.target.value)} placeholder="spot spray, hand pull, pre-emergent…" /></label>}
        <label className={`${styles.field} ${styles.fieldWide}`}><span>Note <small>optional</small></span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you notice?" /></label>
        <button type="submit" className={styles.primaryButton}>Log {eventLabel(type).toLowerCase()}</button>
      </form>
      <div className={styles.logList}>
        {events.length === 0 && <p className={styles.emptyCopy}>No care events yet. Start with the last thing you remember doing.</p>}
        {events.slice(0, 6).map((item) => <div className={styles.logRow} key={item.id}><div><strong>{eventLabel(item.type)}</strong><span>{item.at} · {item.segmentId.replaceAll('-', ' ')}</span></div><button type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${eventLabel(item.type)} entry`}>×</button></div>)}
      </div>
    </section>
  );
}
