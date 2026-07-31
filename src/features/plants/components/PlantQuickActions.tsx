'use client';

import type { PlantEventType } from '../lib/types';
import styles from './PlantCard.module.scss';

const ACTIONS: { type: PlantEventType; label: string }[] = [
  { type: 'watered', label: 'Watered' },
  { type: 'fertilized', label: 'Fertilized' },
  { type: 'replanted', label: 'Replanted' },
];

interface PlantQuickActionsProps {
  busy: boolean;
  pendingType: PlantEventType | null;
  wateringSaving: boolean;
  onWater: () => void;
  onLog: (type: PlantEventType) => void;
}

export function PlantQuickActions({
  busy,
  pendingType,
  wateringSaving,
  onWater,
  onLog,
}: PlantQuickActionsProps) {
  return (
    <div className={styles.actions}>
      {ACTIONS.map((action) => (
        <button
          key={action.type}
          type="button"
          className={styles.action}
          data-action={action.type}
          onClick={() => (action.type === 'watered' ? onWater() : onLog(action.type))}
          disabled={busy}
        >
          {pendingType === action.type || (action.type === 'watered' && wateringSaving)
            ? 'Saving...'
            : action.label}
        </button>
      ))}
    </div>
  );
}
