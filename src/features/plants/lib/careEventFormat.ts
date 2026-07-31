/**
 * Care-event labels and per-event formatting for plant data. Pure functions
 * only.
 */

import type { PlantEvent, PlantEventType, PlantStats } from './types';

const EVENT_TYPE_LABELS: Record<PlantEventType, string> = {
  watered: 'Watered',
  watered_nutrition: 'Watered + Nutrition',
  fertilized: 'Fertilized',
  replanted: 'Replanted',
  note: 'Note',
  vibe_check: 'Vibe check',
};

export function eventTypeLabel(type: PlantEventType): string {
  return EVENT_TYPE_LABELS[type];
}

const STATUS_LABELS: Record<PlantStats['wateringStatus'], string> = {
  ok: 'On track',
  due: 'Due soon',
  overdue: 'Overdue',
  unknown: 'No history yet',
};

export function statusLabel(status: PlantStats['wateringStatus']): string {
  return STATUS_LABELS[status];
}

const TREND_LABELS: Record<PlantStats['wateringTrend'], string> = {
  accelerating: 'Watering more often',
  steady: 'Holding steady',
  slowing: 'Watering less often',
  unknown: 'Not enough history',
};

export function trendLabel(trend: PlantStats['wateringTrend']): string {
  return TREND_LABELS[trend];
}

export function formatVibe(rating: number | null): string {
  return rating === null ? 'n/a' : `${rating}/10`;
}

export function formatWateringWeights(event: PlantEvent): string | null {
  const parts: string[] = [];
  if (event.weightBefore) {
    parts.push(`Before ${event.weightBefore}`);
  }
  if (event.weightAfter) {
    parts.push(`After ${event.weightAfter}`);
  }
  return parts.length > 0 ? parts.join(' / ') : null;
}

export function eventDetail(event: PlantEvent): string {
  if (event.type === 'note' && event.note) {
    return `: ${event.note}`;
  }
  if (event.type === 'vibe_check' && typeof event.rating === 'number') {
    return `: ${event.rating}/10`;
  }
  const weights = formatWateringWeights(event);
  if (weights) {
    return `: ${weights}`;
  }
  return '';
}
