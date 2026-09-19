import type { CareEvent, GrassProfile, WeatherSnapshot } from '../types';
import { DEFAULT_PROFILE } from '../yard';

export const NOW = new Date('2026-09-18T12:00:00Z'); // 8 AM in the yard.
export const PROFILE: GrassProfile = { ...DEFAULT_PROFILE, grassType: 'tall-fescue', configured: true };
export function forecast(): WeatherSnapshot {
  const dates = Array.from({ length: 14 }, (_, index) =>
    new Date(Date.UTC(2026, 8, 11 + index)).toISOString().slice(0, 10));
  return {
    timezone: 'America/New_York', fetchedAt: NOW.toISOString(),
    current: { time: '2026-09-18T08:00', temperature: 72, apparentTemperature: 72, humidity: 50, windSpeed: 5, weatherCode: 0, isDay: 1 },
    daily: dates.map((date, index) => ({
      date, weatherCode: 0, temperatureMax: 78, temperatureMin: 60, precipitation: 0,
      precipitationProbability: 5, sunrise: `${date}T06:${40 + index}`, sunset: `${date}T19:00`,
      sunshineDuration: 40_000, windSpeedMax: 8,
    })),
    hourly: dates.flatMap((date) => Array.from({ length: 24 }, (_, hour) => ({
      time: `${date}T${String(hour).padStart(2, '0')}:00`, precipitation: 0, precipitationProbability: 5,
    }))),
  };
}
export function care(at: string, segmentId = 'whole-yard', type: CareEvent['type'] = 'watered'): CareEvent {
  return { id: `${at}-${segmentId}-${type}`, at, segmentId, type, minutes: 20 };
}
