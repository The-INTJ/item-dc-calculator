'use client';

import { useState } from 'react';

import { formatDaysAgo } from '../lib/format';
import { computePlantStats } from '../lib/stats';
import type { Plant } from '../lib/types';
import styles from './PlantCard.module.scss';
import { PlantCardFooter } from './PlantCardFooter';
import { PlantCareStats } from './PlantCareStats';
import { PlantHistorySection } from './PlantHistorySection';
import { PlantNotesSection, PlantVibeSection } from './PlantJournalSections';
import { PlantQuickActions } from './PlantQuickActions';
import { usePlantEventLog, usePlantJournal, usePlantManageActions } from './plantCardActions';
import { useWateringDialog } from './useWateringDialog';
import { WateringWeightModal } from './WateringWeightModal';

interface PlantCardProps {
  plant: Plant;
  onChanged: (plant: Plant) => void;
  onRemoved: (id: string) => void;
}

export function PlantCard({ plant, onChanged, onRemoved }: PlantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deps = { plant, onChanged, setError };
  const watering = useWateringDialog(deps);
  const eventLog = usePlantEventLog(deps);
  const journal = usePlantJournal(deps);
  const manage = usePlantManageActions({ ...deps, onRemoved });

  const now = Date.now();
  const stats = computePlantStats(plant, now);
  const busy = eventLog.pendingType !== null || watering.wateringSaving;
  const history = [...plant.events].sort((a, b) => b.at - a.at);
  const notes = history.filter((event) => event.type === 'note');
  const dialog = watering.wateringDialog;

  return (
    <div className={styles.card} data-status={stats.wateringStatus}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className={styles.statusDot} aria-hidden="true" />
        <span className={styles.headerText}>
          <span className={styles.name}>{plant.name}</span>
          <span className={styles.sub}>
            {stats.lastWateredAt === null
              ? 'Not watered yet'
              : `Watered ${formatDaysAgo(stats.lastWateredAt, now)}`}
          </span>
        </span>
        <span className={styles.chevron} data-expanded={expanded} aria-hidden="true">
          ▾
        </span>
      </button>

      <PlantQuickActions
        busy={busy}
        pendingType={eventLog.pendingType}
        wateringSaving={watering.wateringSaving}
        onWater={watering.openWateringDialog}
        onLog={eventLog.logEvent}
      />

      {error && <p className={styles.error}>{error}</p>}

      {expanded && (
        <div className={styles.details}>
          <PlantCareStats stats={stats} now={now} />
          <PlantNotesSection notes={notes} now={now} journal={journal} />
          <PlantVibeSection lastVibeRating={stats.lastVibeRating} journal={journal} />
          <PlantHistorySection
            history={history}
            now={now}
            onEditWatering={watering.openWateringEdit}
            onRemoveEvent={eventLog.removeEvent}
          />
          <PlantCardFooter plantName={plant.name} manage={manage} />
        </div>
      )}

      {dialog && (
        <WateringWeightModal
          title={dialog.mode === 'create' ? `Water ${plant.name}` : 'Edit watering'}
          initialBefore={dialog.mode === 'edit' ? dialog.event.weightBefore ?? '' : ''}
          initialAfter={dialog.mode === 'edit' ? dialog.event.weightAfter ?? '' : ''}
          error={error}
          saving={watering.wateringSaving}
          onClose={watering.closeWateringDialog}
          onSubmit={watering.submitWateringWeights}
        />
      )}
    </div>
  );
}
