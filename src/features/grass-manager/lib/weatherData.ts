import type { DailyWeather, HourlyWeather, WeatherSnapshot } from './types';

type Fields = Record<string, unknown>;
export interface OpenMeteoPayload { timezone?: string; current?: Fields; daily?: Fields; hourly?: Fields }

function required(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Incomplete weather data');
  return value;
}

function optional(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function at(fields: Fields, key: string, index: number): unknown {
  const values = fields[key];
  return Array.isArray(values) ? values[index] : undefined;
}

function dailyWeather(fields: Fields): DailyWeather[] {
  if (!Array.isArray(fields.time)) throw new Error('Missing daily forecast');
  return fields.time.map((date, i) => ({
    date: String(date),
    weatherCode: required(at(fields, 'weather_code', i)),
    temperatureMax: required(at(fields, 'temperature_2m_max', i)),
    temperatureMin: required(at(fields, 'temperature_2m_min', i)),
    precipitation: required(at(fields, 'precipitation_sum', i)),
    precipitationProbability: optional(at(fields, 'precipitation_probability_max', i)),
    sunrise: String(at(fields, 'sunrise', i) ?? ''),
    sunset: String(at(fields, 'sunset', i) ?? ''),
    sunshineDuration: optional(at(fields, 'sunshine_duration', i)) ?? 0,
    windSpeedMax: required(at(fields, 'wind_speed_10m_max', i)),
  }));
}

function hourlyWeather(fields: Fields): HourlyWeather[] {
  if (!Array.isArray(fields.time)) return [];
  return fields.time.map((time, i) => ({
    time: String(time),
    precipitation: optional(at(fields, 'precipitation', i)),
    precipitationProbability: optional(at(fields, 'precipitation_probability', i)),
  }));
}

export function normalizeWeather(payload: OpenMeteoPayload): WeatherSnapshot {
  const current = payload.current ?? {};
  if (!payload.timezone || typeof current.time !== 'string') throw new Error('Incomplete weather data');
  // Reject bad/missing measurements; null is not zero rain or a clear sky.
  new Intl.DateTimeFormat('en', { timeZone: payload.timezone });
  const daily = dailyWeather(payload.daily ?? {});
  if (daily.filter((day) => day.date >= String(current.time).slice(0, 10)).length < 5) {
    throw new Error('Incomplete five-day forecast');
  }
  return {
    timezone: payload.timezone, daily, hourly: hourlyWeather(payload.hourly ?? {}),
    current: {
      time: current.time, temperature: required(current.temperature_2m),
      apparentTemperature: required(current.apparent_temperature),
      humidity: required(current.relative_humidity_2m), windSpeed: required(current.wind_speed_10m),
      weatherCode: required(current.weather_code), isDay: required(current.is_day),
    },
    fetchedAt: new Date().toISOString(),
  };
}
