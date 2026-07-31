'use client';

import { eventTypeLabel, formatDaysAgo, formatWateringWeights } from '../lib/format';
import type { PlantEvent } from '../lib/types';
import styles from './PlantCard.module.scss';

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

interface PlantHistorySectionProps {
  history: PlantEvent[];
  now: number;
  onEditWatering: (event: PlantEvent) => void;
  onRemoveEvent: (eventId: string) => void;
}

export function PlantHistorySection({
  history,
  now,
  onEditWatering,
  onRemoveEvent,
}: PlantHistorySectionProps) {
  return (
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
                    onClick={() => onEditWatering(event)}
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
                  onClick={() => onRemoveEvent(event.id)}
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
  );
}
