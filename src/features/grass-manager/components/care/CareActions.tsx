'use client';

import { useState } from 'react';
import type { CareEvent, GrassProfile } from '../../lib/types';
import { eventLabel } from '../../lib/storage';
import { segmentName } from '../../lib/yard';
import { CareEntryForm } from './CareEntryForm';
import styles from '../GrassManagerView.module.scss';

interface Props {
  scope: string; today: string; profile: GrassProfile; disabled?: boolean;
  onAdd: (event: Omit<CareEvent, 'id'>) => void;
}

export function CareActions({ scope, today, profile, disabled, onAdd }: Props) {
  const [type, setType] = useState<CareEvent['type'] | null>(null);
  const [saved, setSaved] = useState('');
  function save(event: Omit<CareEvent, 'id'>) {
    onAdd(event);
    setSaved(`${eventLabel(event.type)} saved for ${segmentName(scope).toLowerCase()}.`);
    setType(null);
  }
  return (
    <div className={styles.careActions} role="group" aria-label={`${segmentName(scope)} care`}>
      <div className={styles.buttonRow}>
        <span className={styles.scopeLabel}>Log · {segmentName(scope)}</span>
        {(['watered', 'fertilized', 'weed-control', 'hand-weeded'] as const).map((action) => (
          <button key={action} type="button" disabled={disabled} aria-expanded={type === action}
            onClick={() => { setType(type === action ? null : action); setSaved(''); }}>{eventLabel(action)}</button>
        ))}
      </div>
      {type && <CareEntryForm key={type} type={type} scope={scope} today={today} profile={profile} onAdd={save} onCancel={() => setType(null)} />}
      {saved && <span className={styles.savedLine} role="status">{saved}</span>}
    </div>
  );
}
