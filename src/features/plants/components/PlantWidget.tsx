'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import { formatDaysShort } from '../lib/format';
import { computePlantStats, urgencyRank } from '../lib/stats';
import type { Plant } from '../lib/types';
import styles from './PlantWidget.module.scss';

const MAX_ROWS = 6;

export function PlantWidget() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    plantsApi.list().then((result) => {
      if (!active) {
        return;
      }
      if (result.success) {
        setPlants(result.data ?? []);
        setError(null);
      } else {
        setError(result.error ?? 'Could not load plants.');
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function water(id: string) {
    setPendingId(id);
    const result = await plantsApi.addEvent(id, 'watered');
    setPendingId(null);
    if (result.success && result.data) {
      const updated = result.data;
      setPlants((current) =>
        current.map((plant) => (plant.id === updated.id ? updated : plant)),
      );
    }
  }

  const now = Date.now();
  const ranked = [...plants].sort((a, b) => {
    const statsA = computePlantStats(a, now);
    const statsB = computePlantStats(b, now);
    const byUrgency =
      urgencyRank(statsA.wateringStatus) - urgencyRank(statsB.wateringStatus);
    if (byUrgency !== 0) {
      return byUrgency;
    }
    return (statsB.daysSinceWatered ?? -1) - (statsA.daysSinceWatered ?? -1);
  });
  const visible = ranked.slice(0, MAX_ROWS);
  const remaining = ranked.length - visible.length;

  return (
    <section className={styles.widget}>
      <div className={styles.head}>
        <h2 className={styles.title}>Plant care</h2>
        {plants.length > 0 && (
          <span className={styles.count}>
            {plants.length} {plants.length === 1 ? 'plant' : 'plants'}
          </span>
        )}
      </div>

      {loading && <p className={styles.message}>Loading your plants…</p>}

      {!loading && error && <p className={styles.message}>{error}</p>}

      {!loading && !error && plants.length === 0 && (
        <>
          <p className={styles.message}>No plants tracked yet.</p>
          <Link href="/plants" className={styles.link}>
            Start tracking your plants →
          </Link>
        </>
      )}

      {!loading && !error && plants.length > 0 && (
        <>
          <ul className={styles.list}>
            {visible.map((plant) => {
              const stats = computePlantStats(plant, now);
              return (
                <li key={plant.id} className={styles.row}>
                  <span
                    className={styles.dot}
                    data-status={stats.wateringStatus}
                    aria-hidden="true"
                  />
                  <span className={styles.rowName}>{plant.name}</span>
                  <span className={styles.rowAge}>
                    {formatDaysShort(stats.lastWateredAt, now)}
                  </span>
                  <button
                    type="button"
                    className={styles.waterButton}
                    onClick={() => water(plant.id)}
                    disabled={pendingId === plant.id}
                  >
                    {pendingId === plant.id ? '…' : 'Water'}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            <span className={styles.more}>
              {remaining > 0 ? `+${remaining} more` : ''}
            </span>
            <Link href="/plants" className={styles.link}>
              Open plant tracker →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
