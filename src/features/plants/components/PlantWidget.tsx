'use client';

import Link from 'next/link';

import { rankPlantsByUrgency } from '../lib/plant-ordering';
import styles from './PlantWidget.module.scss';
import { PlantWidgetRow } from './PlantWidgetRow';
import { usePlantWatering } from './usePlantWatering';
import { WateringWeightModal } from './WateringWeightModal';

const MAX_ROWS = 6;

export function PlantWidget() {
  const {
    plants,
    loading,
    error,
    pendingId,
    wateringPlant,
    wateringSaving,
    openWatering,
    closeWatering,
    submitWatering,
  } = usePlantWatering();

  const now = Date.now();
  const ranked = rankPlantsByUrgency(plants, now);
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
            {visible.map((plant) => (
              <PlantWidgetRow
                key={plant.id}
                plant={plant}
                now={now}
                pending={pendingId === plant.id}
                onWater={() => openWatering(plant)}
              />
            ))}
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

      {wateringPlant && (
        <WateringWeightModal
          title={`Water ${wateringPlant.name}`}
          error={error}
          saving={wateringSaving}
          onClose={closeWatering}
          onSubmit={submitWatering}
        />
      )}
    </section>
  );
}
