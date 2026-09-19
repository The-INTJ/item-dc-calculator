import { describe, expect, it } from 'vitest';
import { forecast } from './fixtures/weather';
import { normalizeWeather, type OpenMeteoPayload } from './weatherData';

function payload(): OpenMeteoPayload {
  const weather = forecast();
  return {
    timezone: weather.timezone,
    current: { time: weather.current.time, temperature_2m: 72, apparent_temperature: 72, relative_humidity_2m: 50, wind_speed_10m: 8, weather_code: 0, is_day: 1 },
    daily: {
      time: weather.daily.map((day) => day.date), weather_code: weather.daily.map(() => 0),
      temperature_2m_max: weather.daily.map(() => 78), temperature_2m_min: weather.daily.map(() => 60),
      precipitation_sum: weather.daily.map(() => 0), precipitation_probability_max: weather.daily.map(() => 5),
      sunrise: weather.daily.map((day) => day.sunrise), sunset: weather.daily.map((day) => day.sunset),
      wind_speed_10m_max: weather.daily.map(() => 8),
    },
    hourly: { time: weather.hourly.map((hour) => hour.time), precipitation: weather.hourly.map(() => 0), precipitation_probability: weather.hourly.map(() => 5) },
  };
}

describe('Open-Meteo normalization', () => {
  it('preserves past weather and future hourly rainfall', () => {
    const result = normalizeWeather(payload());
    expect(result.daily).toHaveLength(14);
    expect(result.hourly).toHaveLength(336);
    expect(result.timezone).toBe('America/New_York');
  });
  it('rejects null temperatures instead of displaying freezing zero degrees', () => {
    const input = payload();
    input.current!.temperature_2m = null;
    expect(() => normalizeWeather(input)).toThrow('Incomplete');
  });
  it('does not turn missing rain probabilities into a confident zero', () => {
    const input = payload();
    delete input.hourly!.precipitation_probability;
    expect(normalizeWeather(input).hourly[0].precipitationProbability).toBeNull();
  });
  it('rejects a truncated five-day forecast', () => {
    const input = payload();
    input.daily!.time = ['2026-09-18'];
    expect(() => normalizeWeather(input)).toThrow('five-day');
  });
});
