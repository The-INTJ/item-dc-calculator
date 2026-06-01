/**
 * Presentation + export formatting for plant data. Pure functions only, shared
 * by the React UI and the `/api/plants/export` endpoint.
 */

import { computePlantStats, daysBetween } from './stats';
import type { Plant, PlantEvent, PlantEventType, PlantStats } from './types';

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

/** Human phrase for "how long ago", e.g. "never", "today", "5 days ago". */
export function formatDaysAgo(at: number | null, now: number): string {
  if (at === null) {
    return 'never';
  }
  const days = daysBetween(at, now);
  if (days < 1 / 24) {
    return 'just now';
  }
  if (days < 1) {
    return 'today';
  }
  const whole = Math.floor(days);
  return whole === 1 ? 'yesterday' : `${whole} days ago`;
}

/** Compact day count for badges, e.g. "5d" or "—" when there is no history. */
export function formatDaysShort(at: number | null, now: number): string {
  if (at === null) {
    return '—';
  }
  return `${Math.floor(Math.max(0, daysBetween(at, now)))}d`;
}

/** One-decimal day interval, e.g. "4.2 days" or "—". */
export function formatInterval(days: number | null): string {
  return days === null ? '—' : `${days.toFixed(1)} days`;
}

export function formatVibe(rating: number | null): string {
  return rating === null ? 'n/a' : `${rating}/10`;
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function isoDateTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
}

function describeSince(at: number | null, daysSince: number | null): string {
  if (at === null || daysSince === null) {
    return 'never';
  }
  return `${daysSince.toFixed(1)} days ago (${isoDate(at)})`;
}

function eventDetail(event: PlantEvent): string {
  if (event.type === 'note' && event.note) {
    return `: ${event.note}`;
  }
  if (event.type === 'vibe_check' && typeof event.rating === 'number') {
    return `: ${event.rating}/10`;
  }
  return '';
}

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
