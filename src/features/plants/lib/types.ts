/**
 * Core data model for the plant care tracker.
 *
 * A {@link Plant} stores its full history as an array of {@link PlantEvent}s so
 * that watering cadence, nutrition cadence and trends can be derived after the
 * fact (see `stats.ts`).
 */

export const PLANT_EVENT_TYPES = ['watered', 'watered_nutrition', 'replanted'] as const;

export type PlantEventType = (typeof PLANT_EVENT_TYPES)[number];

export interface PlantEvent {
  id: string;
  type: PlantEventType;
  /** Epoch milliseconds when the care action was logged. */
  at: number;
}

export interface Plant {
  id: string;
  name: string;
  /** Epoch milliseconds when the plant was added to the tracker. */
  createdAt: number;
  /** Full care history. Not guaranteed sorted — consumers sort by `at`. */
  events: PlantEvent[];
}

export type WateringStatus = 'ok' | 'due' | 'overdue' | 'unknown';

export type WateringTrend = 'accelerating' | 'steady' | 'slowing' | 'unknown';

/** Derived, never-persisted metrics for a single plant. */
export interface PlantStats {
  totalWaterings: number;
  totalNutritions: number;
  totalReplants: number;
  totalEvents: number;

  lastWateredAt: number | null;
  lastNutritionAt: number | null;
  lastReplantedAt: number | null;
  firstEventAt: number | null;

  daysSinceWatered: number | null;
  daysSinceNutrition: number | null;
  daysSinceReplanted: number | null;

  averageWateringIntervalDays: number | null;
  lastWateringIntervalDays: number | null;
  averageNutritionIntervalDays: number | null;

  /**
   * Least-squares slope of the watering interval against its cycle index —
   * the DY/DX of the watering cadence. Positive means intervals are
   * lengthening over time (the plant is being watered less often).
   */
  wateringIntervalSlopeDaysPerCycle: number | null;
  wateringTrend: WateringTrend;

  wateringStatus: WateringStatus;
}

/** Standard result envelope shared by the store and API client. */
export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
