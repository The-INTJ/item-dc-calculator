import { describe, expect, it } from 'vitest';

import { deriveGrassInsights } from './grassInsights';
import type { CareEvent, DailyWeather, GrassProfile } from './types';
import { getSegment } from './yard';
import { weatherTimeLabel } from './weatherTime';
import { evaluateWateringPlan } from './weatherRules';

const profile: GrassProfile = {
  grassType: 'tall-fescue',
  weedTypes: ['crabgrass'],
  sprinklerMinutes: 20,
  locationName: 'Test yard',
  location: null,
};

const day: DailyWeather = {
  date: '2026-09-17',
  weatherCode: 0,
  temperatureMax: 88,
  temperatureMin: 65,
  precipitation: 0,
  precipitationProbability: 5,
  sunrise: '2026-09-17T06:40:00-04:00',
  sunset: '2026-09-17T19:20:00-04:00',
  sunshineDuration: 40_000,
  windSpeedMax: 8,
};

const now = new Date('2026-09-17T08:00:00-04:00');

function event(type: CareEvent['type'], at: string, segmentId = 'back-lawn'): CareEvent {
  return { id: `${type}-${at}`, type, at, segmentId };
}

describe('evaluateWateringPlan', () => {
  it('skips irrigation when meaningful rain is forecast', () => {
    const plan = evaluateWateringPlan({ ...day, weatherCode: 63, precipitation: 0.45, precipitationProbability: 90 }, profile, getSegment('back-lawn'), [], now);
    expect(plan.status).toBe('skip');
    expect(plan.label).toBe('Rain is doing the work');
  });

  it('calls for a deep soak on a hot, clear day when a zone is due', () => {
    const plan = evaluateWateringPlan(day, profile, getSegment('back-lawn'), [event('watered', '2026-09-11')], now);
    expect(plan.status).toBe('water-now');
    expect(plan.minutes).toBeGreaterThan(20);
    expect(plan.timing).toContain('Today');
  });

  it('uses the recent watering log to prevent overwatering', () => {
    const plan = evaluateWateringPlan({ ...day, temperatureMax: 72, weatherCode: 3 }, profile, getSegment('back-lawn'), [event('watered', '2026-09-16')], now);
    expect(plan.status).toBe('wait');
    expect(plan.headline).toContain('not due');
  });

  it('holds irrigation through freezing conditions', () => {
    const plan = evaluateWateringPlan({ ...day, weatherCode: 71, temperatureMax: 38, temperatureMin: 28 }, profile, getSegment('front-square'), [], now);
    expect(plan.status).toBe('skip');
    expect(plan.headline).toContain('frozen');
  });

  it('gives the hill a pulse-and-pause instruction', () => {
    const plan = evaluateWateringPlan(day, profile, getSegment('right-side-hill'), [], now);
    expect(plan.status).toBe('water-now');
    expect(plan.detail).toContain('two passes');
  });
});

describe('weatherTimeLabel', () => {
  it('keeps the forecast location time instead of the browser timezone', () => {
    expect(weatherTimeLabel('2026-09-17T19:20:00-04:00')).toBe('7:20 PM');
  });
});

describe('deriveGrassInsights', () => {
  it('turns a strong zone into an expansion plan and remembers applications', () => {
    const insights = deriveGrassInsights(profile, getSegment('back-lawn'), [
      event('fertilized', '2026-09-15'),
      event('weed-control', '2026-09-14'),
    ], now);
    expect(insights.propagation).toContain('donor zone');
    expect(insights.weedPlan).toContain('2 days');
    expect(insights.actions).toHaveLength(3);
  });
});
