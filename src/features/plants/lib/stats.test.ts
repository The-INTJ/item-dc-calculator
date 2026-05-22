import { describe, expect, it } from 'vitest';

import { computePlantStats, daysBetween, MS_PER_DAY, urgencyRank } from './stats';
import type { Plant, PlantEvent, PlantEventType } from './types';

const NOW = Date.UTC(2026, 4, 21, 12, 0, 0);

let eventCounter = 0;

/** Build an event of `type` that happened `daysAgo` days before `NOW`. */
function event(type: PlantEventType, daysAgo: number): PlantEvent {
  eventCounter += 1;
  return { id: `evt-${eventCounter}`, type, at: NOW - daysAgo * MS_PER_DAY };
}

function plant(events: PlantEvent[]): Plant {
  return {
    id: 'plant-test',
    name: 'Test plant',
    createdAt: NOW - 100 * MS_PER_DAY,
    events,
  };
}

describe('daysBetween', () => {
  it('measures whole days between two timestamps', () => {
    expect(daysBetween(NOW - 3 * MS_PER_DAY, NOW)).toBe(3);
  });
});

describe('computePlantStats', () => {
  it('returns empty metrics for a plant with no events', () => {
    const stats = computePlantStats(plant([]), NOW);
    expect(stats.totalEvents).toBe(0);
    expect(stats.totalWaterings).toBe(0);
    expect(stats.lastWateredAt).toBeNull();
    expect(stats.daysSinceWatered).toBeNull();
    expect(stats.averageWateringIntervalDays).toBeNull();
    expect(stats.wateringStatus).toBe('unknown');
    expect(stats.wateringTrend).toBe('unknown');
  });

  it('counts watered_nutrition as both a watering and a nutrition event', () => {
    const stats = computePlantStats(
      plant([event('watered', 10), event('watered_nutrition', 5), event('watered', 1)]),
      NOW,
    );
    expect(stats.totalWaterings).toBe(3);
    expect(stats.totalNutritions).toBe(1);
    expect(stats.totalReplants).toBe(0);
    expect(stats.daysSinceWatered).toBeCloseTo(1);
    expect(stats.daysSinceNutrition).toBeCloseTo(5);
  });

  it('computes average and most-recent watering intervals', () => {
    const stats = computePlantStats(
      plant([
        event('watered', 20),
        event('watered', 15),
        event('watered', 10),
        event('watered', 5),
      ]),
      NOW,
    );
    expect(stats.averageWateringIntervalDays).toBeCloseTo(5);
    expect(stats.lastWateringIntervalDays).toBeCloseTo(5);
  });

  it('tracks replanting independently of watering', () => {
    const stats = computePlantStats(plant([event('replanted', 40)]), NOW);
    expect(stats.totalReplants).toBe(1);
    expect(stats.daysSinceReplanted).toBeCloseTo(40);
    expect(stats.daysSinceWatered).toBeNull();
  });

  describe('watering status', () => {
    it('is ok when the gap is within the average interval', () => {
      const stats = computePlantStats(
        plant([
          event('watered', 20),
          event('watered', 15),
          event('watered', 10),
          event('watered', 5),
        ]),
        NOW,
      );
      expect(stats.wateringStatus).toBe('ok');
    });

    it('is due when overdue by up to half the average interval', () => {
      const stats = computePlantStats(
        plant([
          event('watered', 21),
          event('watered', 16),
          event('watered', 11),
          event('watered', 6),
        ]),
        NOW,
      );
      expect(stats.wateringStatus).toBe('due');
    });

    it('is overdue when well past the average interval', () => {
      const stats = computePlantStats(
        plant([
          event('watered', 26),
          event('watered', 21),
          event('watered', 16),
          event('watered', 11),
        ]),
        NOW,
      );
      expect(stats.wateringStatus).toBe('overdue');
    });
  });

  describe('watering trend (DY/DX of the interval)', () => {
    it('is accelerating when intervals shrink over time', () => {
      const stats = computePlantStats(
        plant([
          event('watered', 21),
          event('watered', 11),
          event('watered', 4),
          event('watered', 0),
        ]),
        NOW,
      );
      expect(stats.wateringTrend).toBe('accelerating');
      expect(stats.wateringIntervalSlopeDaysPerCycle).toBeLessThan(0);
    });

    it('is slowing when intervals grow over time', () => {
      const stats = computePlantStats(
        plant([
          event('watered', 21),
          event('watered', 17),
          event('watered', 10),
          event('watered', 0),
        ]),
        NOW,
      );
      expect(stats.wateringTrend).toBe('slowing');
      expect(stats.wateringIntervalSlopeDaysPerCycle).toBeGreaterThan(0);
    });

    it('is steady when intervals are consistent', () => {
      const stats = computePlantStats(
        plant([
          event('watered', 20),
          event('watered', 15),
          event('watered', 10),
          event('watered', 5),
        ]),
        NOW,
      );
      expect(stats.wateringTrend).toBe('steady');
    });
  });
});

describe('urgencyRank', () => {
  it('orders overdue ahead of due ahead of ok ahead of unknown', () => {
    expect(urgencyRank('overdue')).toBeLessThan(urgencyRank('due'));
    expect(urgencyRank('due')).toBeLessThan(urgencyRank('ok'));
    expect(urgencyRank('ok')).toBeLessThan(urgencyRank('unknown'));
  });
});
