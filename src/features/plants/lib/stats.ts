/**
 * Pure analytics for plant care history. Everything here is deterministic given
 * a `now` timestamp, so it is safe to run on the server (export endpoint) and
 * the client (card UI) alike, and is exercised directly by `stats.test.ts`.
 */

import type {
  Plant,
  PlantEvent,
  PlantStats,
  WateringStatus,
  WateringTrend,
} from './types';

export const MS_PER_DAY = 86_400_000;

/** Fractional days from `earlier` to `later` (both epoch milliseconds). */
export function daysBetween(earlier: number, later: number): number {
  return (later - earlier) / MS_PER_DAY;
}

/** A plain watering and a watering-with-nutrition both count as watering. */
export function isWateringEvent(event: PlantEvent): boolean {
  return event.type === 'watered' || event.type === 'watered_nutrition';
}

function byTimeAscending(a: PlantEvent, b: PlantEvent): number {
  return a.at - b.at;
}

function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Gaps in days between each consecutive pair of ascending timestamps. */
function intervalDays(timestamps: number[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < timestamps.length; i += 1) {
    gaps.push(daysBetween(timestamps[i - 1], timestamps[i]));
  }
  return gaps;
}

/**
 * Least-squares slope of `values` against their index. Used to express how the
 * watering interval is changing over time (its DY/DX).
 */
function regressionSlope(values: number[]): number | null {
  const n = values.length;
  if (n < 2) {
    return null;
  }
  const xMean = (n - 1) / 2;
  const yMean = mean(values) ?? 0;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  if (denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

function deriveTrend(
  slope: number | null,
  averageInterval: number | null,
): WateringTrend {
  if (slope === null || averageInterval === null || averageInterval <= 0) {
    return 'unknown';
  }
  // Treat slow drift (under 8% of the typical interval per cycle) as steady.
  const relative = slope / averageInterval;
  if (Math.abs(relative) < 0.08) {
    return 'steady';
  }
  return slope > 0 ? 'slowing' : 'accelerating';
}

function deriveStatus(
  daysSinceWatered: number | null,
  averageInterval: number | null,
): WateringStatus {
  if (daysSinceWatered === null || averageInterval === null || averageInterval <= 0) {
    return 'unknown';
  }
  if (daysSinceWatered <= averageInterval) {
    return 'ok';
  }
  if (daysSinceWatered <= averageInterval * 1.5) {
    return 'due';
  }
  return 'overdue';
}

/** Derive every metric in {@link PlantStats} from a plant's raw event history. */
export function computePlantStats(plant: Plant, now: number = Date.now()): PlantStats {
  const events = [...(plant.events ?? [])].sort(byTimeAscending);

  const wateringEvents = events.filter(isWateringEvent);
  const nutritionEvents = events.filter((event) => event.type === 'watered_nutrition');
  const replantEvents = events.filter((event) => event.type === 'replanted');

  const lastAt = (list: PlantEvent[]): number | null =>
    list.length > 0 ? list[list.length - 1].at : null;

  const lastWateredAt = lastAt(wateringEvents);
  const lastNutritionAt = lastAt(nutritionEvents);
  const lastReplantedAt = lastAt(replantEvents);

  const wateringIntervals = intervalDays(wateringEvents.map((event) => event.at));
  const nutritionIntervals = intervalDays(nutritionEvents.map((event) => event.at));

  const averageWateringIntervalDays = mean(wateringIntervals);
  const lastWateringIntervalDays =
    wateringIntervals.length > 0
      ? wateringIntervals[wateringIntervals.length - 1]
      : null;

  // Three intervals (four waterings) is the floor for a meaningful trend line.
  const slope = wateringIntervals.length >= 3 ? regressionSlope(wateringIntervals) : null;

  const sinceDays = (at: number | null): number | null =>
    at === null ? null : Math.max(0, daysBetween(at, now));

  const daysSinceWatered = sinceDays(lastWateredAt);

  return {
    totalWaterings: wateringEvents.length,
    totalNutritions: nutritionEvents.length,
    totalReplants: replantEvents.length,
    totalEvents: events.length,

    lastWateredAt,
    lastNutritionAt,
    lastReplantedAt,
    firstEventAt: events.length > 0 ? events[0].at : null,

    daysSinceWatered,
    daysSinceNutrition: sinceDays(lastNutritionAt),
    daysSinceReplanted: sinceDays(lastReplantedAt),

    averageWateringIntervalDays,
    lastWateringIntervalDays,
    averageNutritionIntervalDays: mean(nutritionIntervals),

    wateringIntervalSlopeDaysPerCycle: slope,
    wateringTrend: deriveTrend(slope, averageWateringIntervalDays),

    wateringStatus: deriveStatus(daysSinceWatered, averageWateringIntervalDays),
  };
}

const URGENCY_RANK: Record<WateringStatus, number> = {
  overdue: 0,
  due: 1,
  ok: 2,
  unknown: 3,
};

/** Lower rank = more urgent. Useful for sorting plants that need attention. */
export function urgencyRank(status: WateringStatus): number {
  return URGENCY_RANK[status];
}
