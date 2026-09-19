import { describe, expect, it } from 'vitest';
import { care, forecast, NOW, PROFILE } from '../fixtures/weather';
import { getSegment, YARD_SEGMENTS } from '../yard';
import { buildWateringOutlook, combineYardOutlooks, wateringAmount } from './index';
import { weatherTimeLabel } from '../weatherTime';

const segment = getSegment('back-lawn');
const plan = (weather = forecast(), events = [care('2026-09-10')]) =>
  buildWateringOutlook(weather, PROFILE, segment, events, NOW)[0];

describe('five-day watering outlook', () => {
  it('returns exactly five future days, excluding historical weather', () => {
    const days = buildWateringOutlook(forecast(), PROFILE, segment, [], NOW);
    expect(days).toHaveLength(5);
    expect(days.map((day) => day.date)).toEqual(['2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22']);
  });
  it('looks into tomorrow for useful rain instead of irrigating today', () => {
    const weather = forecast();
    weather.hourly.find((hour) => hour.time === '2026-09-19T05:00')!.precipitation = 0.3;
    weather.hourly.find((hour) => hour.time === '2026-09-19T05:00')!.precipitationProbability = 80;
    expect(plan(weather).label).toBe('Wait for rain');
    expect(plan(weather).reason).toContain('tomorrow');
    expect(plan(weather).reason).toContain('0.30');
  });
  it('does not treat a trace shower as enough water', () => {
    const weather = forecast();
    weather.hourly.find((hour) => hour.time === '2026-09-18T12:00')!.precipitation = 0.01;
    weather.hourly.find((hour) => hour.time === '2026-09-18T12:00')!.precipitationProbability = 100;
    expect(plan(weather).status).toBe('water-now');
  });
  it('does not wait for rain two days away', () => {
    const weather = forecast();
    weather.hourly.find((hour) => hour.time === '2026-09-20T12:00')!.precipitation = 1;
    weather.hourly.find((hour) => hour.time === '2026-09-20T12:00')!.precipitationProbability = 90;
    expect(plan(weather).status).toBe('water-now');
  });
  it('accounts for rain already estimated today and yesterday', () => {
    const weather = forecast();
    weather.daily.find((day) => day.date === '2026-09-17')!.precipitation = 0.3;
    expect(plan(weather).label).toBe('Wait · recent rain');
    weather.daily.find((day) => day.date === '2026-09-17')!.precipitation = 0;
    weather.hourly.find((hour) => hour.time === '2026-09-18T06:00')!.precipitation = 0.4;
    expect(plan(weather).label).toBe('Wait · recent rain');
  });
  it('carries likely future rain forward, conditional on it arriving', () => {
    const weather = forecast();
    Object.assign(weather.daily.find((day) => day.date === '2026-09-19')!, { precipitation: 0.5, precipitationProbability: 90 });
    const days = buildWateringOutlook(weather, PROFILE, segment, [], NOW);
    expect(days[2].label).toBe('Wait · recent rain');
    expect(days[2].reason).toContain('expected beforehand');
  });
  it('does not claim a watering happened in its projection', () => {
    const days = buildWateringOutlook(forecast(), PROFILE, segment, [], NOW);
    expect(days.every((day) => day.label !== 'Wait · watered')).toBe(true);
  });
  it('waits after whole-yard watering even during heat', () => {
    const weather = forecast();
    weather.daily.find((day) => day.date === '2026-09-18')!.temperatureMax = 95;
    expect(plan(weather, [care('2026-09-17')]).label).toBe('Wait · watered');
  });
  it('only applies local watering to that area', () => {
    const events = [care('2026-09-18', 'left-side-hill')];
    expect(plan(forecast(), events).label).toBe('Water if dry');
    const hill = buildWateringOutlook(forecast(), PROFILE, getSegment('left-side-hill'), events, NOW);
    expect(hill[0].label).toBe('Wait · watered');
  });
  it('combines areas without saying a partly watered yard is all watered', () => {
    const events = [care('2026-09-18', 'left-side-hill')];
    const combined = combineYardOutlooks(YARD_SEGMENTS.map((segment) => ({
      segment, days: buildWateringOutlook(forecast(), PROFILE, segment, events, NOW),
    })));
    expect(combined[0].label).toBe('Water if dry');
    expect(combined[0].reason).toContain('Back lawn');
  });
  it('ignores future logs and counts calendar days in the yard timezone', () => {
    expect(plan(forecast(), [care('2026-09-19')]).label).not.toBe('Wait · watered');
    const now = new Date('2026-09-19T02:00:00Z');
    const weather = forecast();
    weather.fetchedAt = now.toISOString();
    const days = buildWateringOutlook(weather, PROFILE, segment, [care('2026-09-18')], now);
    expect(days[0].date).toBe('2026-09-18');
    expect(days[0].label).toBe('Wait · watered');
  });
  it('surfaces a treated area before a whole-yard watering suggestion', () => {
    const events = [care('2026-09-18', 'left-side-hill', 'weed-control')];
    const combined = combineYardOutlooks(YARD_SEGMENTS.map((segment) => ({
      segment, days: buildWateringOutlook(forecast(), PROFILE, segment, events, NOW),
    })));
    expect(combined[0].label).toBe('Check product label');
    expect(combined[0].reason).toContain('Left side hill');
  });
  it.each([48, 56, 57, 66, 67, 71, 73, 75, 77, 85, 86])('skips frozen conditions (WMO %i)', (code) => {
    const weather = forecast();
    weather.current.weatherCode = code;
    expect(plan(weather).label).toBe('Skip · frost');
  });
  it.each([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99])('skips active precipitation (WMO %i)', (code) => {
    const weather = forecast();
    weather.current.weatherCode = code;
    expect(plan(weather).label).toBe('Skip · raining');
  });
  it('does not count fog as irrigating rain', () => {
    const weather = forecast();
    weather.current.weatherCode = 45;
    expect(plan(weather).status).toBe('water-now');
  });
  it('does not call hot overcast days mild', () => {
    const weather = forecast();
    Object.assign(weather.daily.find((day) => day.date === '2026-09-18')!, { weatherCode: 3, temperatureMax: 92, sunshineDuration: 1000 });
    expect(plan(weather, [care('2026-09-16')]).reason).toContain('Heat');
  });
  it('treats shade and cooler/cloudy weather as slower drying', () => {
    const weather = forecast();
    Object.assign(weather.daily.find((day) => day.date === '2026-09-18')!, { temperatureMax: 60, sunshineDuration: 1000 });
    expect(plan(weather, [care('2026-09-13')]).status).toBe('check-soil');
    const shade = buildWateringOutlook(forecast(), PROFILE, { ...segment, sun: 'shade' }, [care('2026-09-14')], NOW);
    expect(shade[0].status).toBe('check-soil');
  });
  it('waits through high wind', () => {
    const weather = forecast();
    weather.current.windSpeed = 20;
    expect(plan(weather).label).toBe('Wait · windy');
  });
  it('uses tomorrow’s sunrise after the morning window has passed', () => {
    const now = new Date('2026-09-18T23:00:00Z');
    const weather = forecast();
    weather.fetchedAt = now.toISOString();
    const today = buildWateringOutlook(weather, PROFILE, segment, [], now)[0];
    expect(today.timing).toContain('Next morning');
    expect(today.timing).toContain('6:48 AM');
    expect(weatherTimeLabel('2026-09-18T19:20:00-04:00')).toBe('7:20 PM');
  });
  it('does not use old, missing, or uncertain rain data as a confident dry forecast', () => {
    const weather = forecast();
    weather.fetchedAt = '2026-09-17T12:00:00Z';
    expect(plan(weather).label).toBe('Refresh forecast');
    weather.fetchedAt = NOW.toISOString();
    weather.hourly = [];
    expect(plan(weather).label).toBe('Check before watering');
  });
  it('lets treatment instructions and seedling needs override the soak schedule', () => {
    expect(plan(forecast(), [care('2026-09-18', 'whole-yard', 'weed-control')]).label).toBe('Check product label');
    expect(plan(forecast(), [care('2026-09-18', 'whole-yard', 'fertilized')]).label).toBe('Check product label');
    const days = buildWateringOutlook(forecast(), { ...PROFILE, lawnStage: 'new-seed' }, segment, [], NOW);
    expect(days[0].label).toBe('Check seedbed');
  });
  it('does not guess sprinkler minutes without catch-cup calibration', () => {
    expect(wateringAmount(PROFILE)).not.toMatch(/About \d+ min/);
    expect(wateringAmount({ ...PROFILE, sprinklerInches: 0.25 })).toContain('40 min');
    expect(wateringAmount(PROFILE, getSegment('left-side-hill'))).toContain('short cycles');
  });
});
