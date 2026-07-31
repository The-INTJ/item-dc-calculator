/**
 * Presentation + export formatting for plant data. Pure functions only, shared
 * by the React UI and the `/api/plants/export` endpoint.
 *
 * Date/duration helpers live in `dateFormat.ts` and care-event labels in
 * `careEventFormat.ts`; both are re-exported here so this module remains the
 * public formatting surface.
 */

import { eventDetail, eventTypeLabel, statusLabel, trendLabel } from './careEventFormat';
import { describeSince, isoDate, isoDateTime } from './dateFormat';
import { computePlantStats } from './stats';
import type { Plant, PlantEventType, PlantStats } from './types';

export {
  eventTypeLabel,
  formatVibe,
  formatWateringWeights,
  statusLabel,
  trendLabel,
} from './careEventFormat';
export { formatDaysAgo, formatDaysShort, formatInterval } from './dateFormat';

export interface PlantExportEntry {
  id: string;
  name: string;
  createdAt: number;
  createdAtISO: string;
  stats: PlantStats;
  events: Array<{
    id: string;
    type: PlantEventType;
    at: number;
    atISO: string;
    weightBefore?: string;
    weightAfter?: string;
    note?: string;
    rating?: number;
  }>;
}

export interface PlantsExport {
  exportedAt: number;
  exportedAtISO: string;
  plantCount: number;
  plants: PlantExportEntry[];
}

/** Structured export — raw history plus derived stats, ready for JSON output. */
export function buildExportJson(plants: Plant[], now: number = Date.now()): PlantsExport {
  return {
    exportedAt: now,
    exportedAtISO: new Date(now).toISOString(),
    plantCount: plants.length,
    plants: plants.map((plant) => {
      const events = [...plant.events].sort((a, b) => a.at - b.at);
      return {
        id: plant.id,
        name: plant.name,
        createdAt: plant.createdAt,
        createdAtISO: new Date(plant.createdAt).toISOString(),
        stats: computePlantStats(plant, now),
        events: events.map((event) => ({
          id: event.id,
          type: event.type,
          at: event.at,
          atISO: new Date(event.at).toISOString(),
          ...(event.weightBefore ? { weightBefore: event.weightBefore } : {}),
          ...(event.weightAfter ? { weightAfter: event.weightAfter } : {}),
          ...(event.note ? { note: event.note } : {}),
          ...(typeof event.rating === 'number' ? { rating: event.rating } : {}),
        })),
      };
    }),
  };
}

/** Markdown digest of the whole collection — the format meant for pasting into an AI. */
export function buildExportText(plants: Plant[], now: number = Date.now()): string {
  const lines: string[] = [
    '# Plant care export',
    `Generated: ${new Date(now).toISOString()}`,
    `Plants tracked: ${plants.length}`,
    '',
  ];

  if (plants.length === 0) {
    lines.push('No plants are being tracked yet.');
    return `${lines.join('\n')}\n`;
  }

  for (const plant of plants) {
    const stats = computePlantStats(plant, now);
    lines.push(`## ${plant.name}`);
    lines.push(`- Added: ${isoDate(plant.createdAt)}`);
    lines.push(`- Status: ${statusLabel(stats.wateringStatus)}`);
    lines.push(`- Last watered: ${describeSince(stats.lastWateredAt, stats.daysSinceWatered)}`);
    lines.push(
      `- Last nutrition: ${describeSince(stats.lastNutritionAt, stats.daysSinceNutrition)}`,
    );
    lines.push(
      `- Last replanted: ${describeSince(stats.lastReplantedAt, stats.daysSinceReplanted)}`,
    );
    lines.push(
      `- Latest vibe: ${
        stats.lastVibeAt === null || stats.lastVibeRating === null
          ? 'n/a'
          : `${stats.lastVibeRating}/10 (${isoDateTime(stats.lastVibeAt)})`
      }`,
    );
    lines.push(
      `- Totals: ${stats.totalWaterings} waterings, ${stats.totalNutritions} with nutrition, ` +
        `${stats.totalReplants} replants, ${stats.totalNotes} notes, ` +
        `${stats.totalVibeChecks} vibe checks`,
    );
    lines.push(
      `- Average watering interval: ${
        stats.averageWateringIntervalDays === null
          ? 'n/a'
          : `${stats.averageWateringIntervalDays.toFixed(2)} days`
      }`,
    );
    lines.push(
      `- Most recent interval: ${
        stats.lastWateringIntervalDays === null
          ? 'n/a'
          : `${stats.lastWateringIntervalDays.toFixed(2)} days`
      }`,
    );
    const slope = stats.wateringIntervalSlopeDaysPerCycle;
    lines.push(
      `- Watering trend: ${trendLabel(stats.wateringTrend)}${
        slope === null
          ? ''
          : ` (slope ${slope >= 0 ? '+' : ''}${slope.toFixed(3)} days per cycle)`
      }`,
    );

    const log = [...plant.events].sort((a, b) => b.at - a.at);
    if (log.length === 0) {
      lines.push('- Event log: (none)');
    } else {
      lines.push('- Event log (most recent first):');
      for (const event of log) {
        lines.push(
          `  - ${isoDateTime(event.at)} - ${eventTypeLabel(event.type)}${eventDetail(event)}`,
        );
      }
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}
