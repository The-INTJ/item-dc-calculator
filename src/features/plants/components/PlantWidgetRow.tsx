'use client';

import { formatDaysShort } from '../lib/format';
import { computePlantStats } from '../lib/stats';
import type { Plant } from '../lib/types';
import styles from './PlantWidget.module.scss';

interface PlantWidgetRowProps {
  plant: Plant;
  now: number;
  pending: boolean;
  onWater: () => void;
}

/** One plant: how thirsty, how long it has been, and the way to fix that. */
export function PlantWidgetRow({ plant, now, pending, onWater }: PlantWidgetRowProps) {
  const stats = computePlantStats(plant, now);

  return (
    <li className={styles.row}>
      <span className={styles.dot} data-status={stats.wateringStatus} aria-hidden="true" />
      <span className={styles.rowName}>{plant.name}</span>
      <span className={styles.rowAge}>{formatDaysShort(stats.lastWateredAt, now)}</span>
      <button
        type="button"
        className={styles.waterButton}
        onClick={onWater}
        disabled={pending}
      >
        {pending ? '…' : 'Water'}
      </button>
    </li>
  );
}
