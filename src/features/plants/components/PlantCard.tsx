'use client';

import { useState, type FormEvent } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import { eventTypeLabel, formatDaysAgo, formatInterval, trendLabel } from '../lib/format';
import { computePlantStats } from '../lib/stats';
import type { Plant, PlantEventType } from '../lib/types';
import styles from './PlantCard.module.scss';

interface PlantCardProps {
  plant: Plant;
  onChanged: (plant: Plant) => void;
  onRemoved: (id: string) => void;
}

const ACTIONS: { type: PlantEventType; label: string }[] = [
  { type: 'watered', label: 'Watered' },
  { type: 'watered_nutrition', label: 'Watered + Nutrition' },
  { type: 'replanted', label: 'Replanted' },
];

export function PlantCard({ plant, onChanged, onRemoved }: PlantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingType, setPendingType] = useState<PlantEventType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(plant.name);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const now = Date.now();
  const stats = computePlantStats(plant, now);
  const busy = pendingType !== null;
  const history = [...plant.events].sort((a, b) => b.at - a.at);

  async function logEvent(type: PlantEventType) {
    setPendingType(type);
    setError(null);
    const result = await plantsApi.addEvent(plant.id, type);
    setPendingType(null);
    if (result.success && result.data) {
      onChanged(result.data);
    } else {
      setError(result.error ?? 'Could not save that action.');
    }
  }

  async function removeEvent(eventId: string) {
    setError(null);
    const result = await plantsApi.deleteEvent(plant.id, eventId);
    if (result.success && result.data) {
      onChanged(result.data);
    } else {
      setError(result.error ?? 'Could not remove that entry.');
    }
  }

  async function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === plant.name) {
      setRenaming(false);
      setNameDraft(plant.name);
      return;
    }
    const result = await plantsApi.rename(plant.id, trimmed);
    if (result.success && result.data) {
      onChanged(result.data);
      setRenaming(false);
    } else {
      setError(result.error ?? 'Could not rename the plant.');
    }
  }

  async function confirmRemove() {
    setRemoving(true);
    setError(null);
    const result = await plantsApi.remove(plant.id);
    if (result.success) {
      onRemoved(plant.id);
    } else {
      setRemoving(false);
      setConfirmingRemove(false);
      setError(result.error ?? 'Could not remove the plant.');
    }
  }

  const statCells: { label: string; value: string }[] = [
    { label: 'Last watered', value: formatDaysAgo(stats.lastWateredAt, now) },
    { label: 'Last nutrition', value: formatDaysAgo(stats.lastNutritionAt, now) },
    { label: 'Last replanted', value: formatDaysAgo(stats.lastReplantedAt, now) },
    { label: 'Avg. watering', value: formatInterval(stats.averageWateringIntervalDays) },
    { label: 'Last interval', value: formatInterval(stats.lastWateringIntervalDays) },
    { label: 'Watering trend', value: trendLabel(stats.wateringTrend) },
    { label: 'Waterings', value: String(stats.totalWaterings) },
    { label: 'Nutrition feeds', value: String(stats.totalNutritions) },
    { label: 'Replants', value: String(stats.totalReplants) },
  ];

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

      <div className={styles.actions}>
        {ACTIONS.map((action) => (
          <button
            key={action.type}
            type="button"
            className={styles.action}
            data-action={action.type}
            onClick={() => logEvent(action.type)}
            disabled={busy}
          >
            {pendingType === action.type ? 'Saving…' : action.label}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {expanded && (
        <div className={styles.details}>
          <section>
            <h3 className={styles.sectionLabel}>Care metrics</h3>
            <div className={styles.statGrid}>
              {statCells.map((cell) => (
                <div key={cell.label} className={styles.stat}>
                  <span className={styles.statLabel}>{cell.label}</span>
                  <span className={styles.statValue}>{cell.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className={styles.sectionLabel}>History</h3>
            {history.length === 0 ? (
              <p className={styles.empty}>No events logged yet.</p>
            ) : (
              <ul className={styles.historyList}>
                {history.map((event) => (
                  <li key={event.id} className={styles.historyRow}>
                    <span className={styles.historyType} data-type={event.type}>
                      {eventTypeLabel(event.type)}
                    </span>
                    <span
                      className={styles.historyWhen}
                      title={new Date(event.at).toLocaleString()}
                    >
                      {formatDaysAgo(event.at, now)}
                    </span>
                    <button
                      type="button"
                      className={styles.historyRemove}
                      onClick={() => removeEvent(event.id)}
                      aria-label={`Remove ${eventTypeLabel(event.type)} entry`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className={styles.footer}>
            {renaming ? (
              <form className={styles.renameForm} onSubmit={submitRename}>
                <input
                  className={styles.renameInput}
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  maxLength={80}
                  autoFocus
                  aria-label="Plant name"
                />
                <button type="submit" className={styles.textButton}>
                  Save
                </button>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => {
                    setRenaming(false);
                    setNameDraft(plant.name);
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setRenaming(true)}
              >
                Rename
              </button>
            )}

            {confirmingRemove ? (
              <span className={styles.confirmRow}>
                <span className={styles.confirmText}>
                  Delete this plant and its history?
                </span>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={confirmRemove}
                  disabled={removing}
                >
                  {removing ? 'Removing…' : 'Delete'}
                </button>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => setConfirmingRemove(false)}
                  disabled={removing}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                className={styles.dangerLink}
                onClick={() => setConfirmingRemove(true)}
              >
                Remove plant
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
