'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AddPlantForm } from './AddPlantForm';
import { PlantCard } from './PlantCard';
import { PlantExportModal } from './PlantExportModal';
import styles from './PlantsView.module.scss';
import { usePlants } from './usePlants';

export function PlantsView() {
  const { plants, loading, loadError, retryLoad, addPlant, handleChanged, handleRemoved } =
    usePlants();
  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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
          onClick={() => setExportOpen(true)}
          disabled={plants.length === 0}
        >
          Export
        </button>
      </div>

      <AddPlantForm
        open={addOpen}
        onCreated={(created) => {
          addPlant(created);
          setAddOpen(false);
        }}
        onCancel={() => setAddOpen(false)}
      />

      {loading && <div className={styles.state}>Loading your plants…</div>}

      {!loading && loadError && (
        <div className={styles.state}>
          <span>{loadError}</span>
          <button type="button" className={styles.retryButton} onClick={retryLoad}>
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
        <PlantExportModal plants={plants} onClose={() => setExportOpen(false)} />
      )}
    </div>
  );
}
