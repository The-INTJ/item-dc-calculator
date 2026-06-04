'use client';

import { useState, type FormEvent } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import {
  eventTypeLabel,
  formatDaysAgo,
  formatInterval,
  formatWateringWeights,
  formatVibe,
  trendLabel,
} from '../lib/format';
import { computePlantStats } from '../lib/stats';
import type { Plant, PlantEvent, PlantEventType, WateringWeightInput } from '../lib/types';
import styles from './PlantCard.module.scss';
import { WateringWeightModal } from './WateringWeightModal';

interface PlantCardProps {
  plant: Plant;
  onChanged: (plant: Plant) => void;
  onRemoved: (id: string) => void;
}

const ACTIONS: { type: PlantEventType; label: string }[] = [
  { type: 'watered', label: 'Watered' },
  { type: 'fertilized', label: 'Fertilized' },
  { type: 'replanted', label: 'Replanted' },
];

type WateringDialogState =
  | { mode: 'create' }
  | { mode: 'edit'; event: PlantEvent };

function isWateringEvent(event: PlantEvent): boolean {
  return event.type === 'watered' || event.type === 'watered_nutrition';
}

function historyDetail(event: PlantEvent): string | null {
  if (event.type === 'note') {
    return event.note ?? null;
  }
  if (event.type === 'vibe_check' && typeof event.rating === 'number') {
    return `${event.rating}/10`;
  }
  const weights = formatWateringWeights(event);
  if (weights) {
    return weights;
  }
  return null;
}

export function PlantCard({ plant, onChanged, onRemoved }: PlantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingType, setPendingType] = useState<PlantEventType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(plant.name);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [vibeDraft, setVibeDraft] = useState('');
  const [vibeSaving, setVibeSaving] = useState(false);
  const [wateringDialog, setWateringDialog] = useState<WateringDialogState | null>(null);
  const [wateringSaving, setWateringSaving] = useState(false);

  const now = Date.now();
  const stats = computePlantStats(plant, now);
  const busy = pendingType !== null || wateringSaving;
  const history = [...plant.events].sort((a, b) => b.at - a.at);
  const notes = history.filter((event) => event.type === 'note');

  function openWateringDialog() {
    setError(null);
    setWateringDialog({ mode: 'create' });
  }

  function openWateringEdit(event: PlantEvent) {
    setError(null);
    setWateringDialog({ mode: 'edit', event });
  }

  function closeWateringDialog() {
    if (!wateringSaving) {
      setWateringDialog(null);
    }
  }

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

  async function submitWateringWeights(weights: WateringWeightInput) {
    const dialog = wateringDialog;
    if (!dialog) {
      return;
    }

    setWateringSaving(true);
    setError(null);
    const result =
      dialog.mode === 'create'
        ? await plantsApi.addEvent(plant.id, { type: 'watered', ...weights })
        : await plantsApi.updateEventWeights(plant.id, dialog.event.id, weights);
    setWateringSaving(false);
    if (result.success && result.data) {
      onChanged(result.data);
      setWateringDialog(null);
    } else {
      setError(result.error ?? 'Could not save watering weights.');
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

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = noteDraft.trim();
    if (!trimmed) {
      setError('Write a note before submitting.');
      return;
    }

    setNoteSaving(true);
    setError(null);
    const result = await plantsApi.addNote(plant.id, trimmed);
    setNoteSaving(false);
    if (result.success && result.data) {
      onChanged(result.data);
      setNoteDraft('');
    } else {
      setError(result.error ?? 'Could not save that note.');
    }
  }

  async function submitVibe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (vibeDraft.trim() === '') {
      setError('Enter a whole number from 0 to 10.');
      return;
    }
    const rating = Number(vibeDraft);
    if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
      setError('Enter a whole number from 0 to 10.');
      return;
    }

    setVibeSaving(true);
    setError(null);
    const result = await plantsApi.addVibeCheck(plant.id, rating);
    setVibeSaving(false);
    if (result.success && result.data) {
      onChanged(result.data);
      setVibeDraft('');
    } else {
      setError(result.error ?? 'Could not save that vibe check.');
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
    { label: 'Latest vibe', value: formatVibe(stats.lastVibeRating) },
    { label: 'Avg. watering', value: formatInterval(stats.averageWateringIntervalDays) },
    { label: 'Last interval', value: formatInterval(stats.lastWateringIntervalDays) },
    { label: 'Watering trend', value: trendLabel(stats.wateringTrend) },
    { label: 'Waterings', value: String(stats.totalWaterings) },
    { label: 'Nutrition feeds', value: String(stats.totalNutritions) },
    { label: 'Replants', value: String(stats.totalReplants) },
    { label: 'Notes', value: String(stats.totalNotes) },
    { label: 'Vibe checks', value: String(stats.totalVibeChecks) },
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
            onClick={() =>
              action.type === 'watered' ? openWateringDialog() : logEvent(action.type)
            }
            disabled={busy}
          >
            {pendingType === action.type || (action.type === 'watered' && wateringSaving)
              ? 'Saving...'
              : action.label}
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
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionLabel}>Notes</h3>
              <button
                type="button"
                className={styles.inlineButton}
                onClick={() => setShowAllNotes((value) => !value)}
                disabled={notes.length === 0}
              >
                {showAllNotes ? 'Hide notes' : `Show all notes (${notes.length})`}
              </button>
            </div>
            <form className={styles.noteForm} onSubmit={submitNote}>
              <textarea
                className={styles.noteInput}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Leaf curl, new growth, pests, spray mix..."
                maxLength={2000}
                rows={3}
                aria-label="Plant note"
              />
              <div className={styles.noteActions}>
                <span className={styles.noteCount}>{noteDraft.length}/2000</span>
                <button type="submit" className={styles.textButton} disabled={noteSaving}>
                  {noteSaving ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
            {showAllNotes && notes.length > 0 && (
              <ul className={styles.noteList}>
                {notes.map((event) => (
                  <li key={event.id} className={styles.noteRow}>
                    <span className={styles.noteWhen} title={new Date(event.at).toLocaleString()}>
                      {formatDaysAgo(event.at, now)}
                    </span>
                    <span className={styles.noteText}>{event.note ?? ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionLabel}>Vibe</h3>
              <span className={styles.latestVibe}>
                Latest {formatVibe(stats.lastVibeRating)}
              </span>
            </div>
            <form className={styles.vibeForm} onSubmit={submitVibe}>
              <label className={styles.vibePill}>
                <input
                  className={styles.vibeInput}
                  value={vibeDraft}
                  onChange={(event) => setVibeDraft(event.target.value)}
                  type="number"
                  min={0}
                  max={10}
                  inputMode="numeric"
                  aria-label="Plant vibe rating"
                />
                <span className={styles.vibeSuffix}>/10</span>
              </label>
              <button type="submit" className={styles.textButton} disabled={vibeSaving}>
                {vibeSaving ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </section>

          <section>
            <h3 className={styles.sectionLabel}>History</h3>
            {history.length === 0 ? (
              <p className={styles.empty}>No events logged yet.</p>
            ) : (
              <ul className={styles.historyList}>
                {history.map((event) => {
                  const detail = historyDetail(event);
                  const wateringEvent = isWateringEvent(event);
                  return (
                    <li key={event.id} className={styles.historyRow}>
                      {wateringEvent ? (
                        <button
                          type="button"
                          className={styles.historyEditButton}
                          onClick={() => openWateringEdit(event)}
                          aria-label={`Edit weights for ${eventTypeLabel(event.type)} entry`}
                        >
                          <span className={styles.historyType} data-type={event.type}>
                            {eventTypeLabel(event.type)}
                          </span>
                          <span
                            className={
                              detail ? styles.historyDetail : styles.historyEmptyDetail
                            }
                          >
                            {detail ?? 'Add weights'}
                          </span>
                          <span
                            className={styles.historyWhen}
                            title={new Date(event.at).toLocaleString()}
                          >
                            {formatDaysAgo(event.at, now)}
                          </span>
                        </button>
                      ) : (
                        <>
                          <span className={styles.historyType} data-type={event.type}>
                            {eventTypeLabel(event.type)}
                          </span>
                          {detail && <span className={styles.historyDetail}>{detail}</span>}
                          <span
                            className={styles.historyWhen}
                            title={new Date(event.at).toLocaleString()}
                          >
                            {formatDaysAgo(event.at, now)}
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        className={styles.historyRemove}
                        onClick={() => removeEvent(event.id)}
                        aria-label={`Remove ${eventTypeLabel(event.type)} entry`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
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

      {wateringDialog && (
        <WateringWeightModal
          title={wateringDialog.mode === 'create' ? `Water ${plant.name}` : 'Edit watering'}
          initialBefore={
            wateringDialog.mode === 'edit' ? wateringDialog.event.weightBefore ?? '' : ''
          }
          initialAfter={
            wateringDialog.mode === 'edit' ? wateringDialog.event.weightAfter ?? '' : ''
          }
          error={error}
          saving={wateringSaving}
          onClose={closeWateringDialog}
          onSubmit={submitWateringWeights}
        />
      )}
    </div>
  );
}
