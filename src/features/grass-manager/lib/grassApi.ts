import type { LocationSearchResult, TipCard, WeatherLocation, WeatherSnapshot } from './types';

interface OpenMeteoPayload {
  timezone?: string;
  current?: Record<string, unknown>;
  daily?: Record<string, unknown>;
}

function numberAt(values: unknown, index: number, fallback = 0): number {
  if (!Array.isArray(values)) return fallback;
  const value = Number(values[index]);
  return Number.isFinite(value) ? value : fallback;
}

function stringAt(values: unknown, index: number, fallback = ''): string {
  if (!Array.isArray(values)) return fallback;
  return typeof values[index] === 'string' ? values[index] : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeWeather(payload: OpenMeteoPayload): WeatherSnapshot {
  const current = payload.current ?? {};
  const daily = payload.daily ?? {};
  const dates = Array.isArray(daily.time) ? daily.time : [];
  return {
    timezone: typeof payload.timezone === 'string' ? payload.timezone : 'auto',
    current: {
      time: String(current.time ?? new Date().toISOString()),
      temperature: numberValue(current.temperature_2m),
      apparentTemperature: numberValue(current.apparent_temperature),
      humidity: numberValue(current.relative_humidity_2m),
      windSpeed: numberValue(current.wind_speed_10m),
      weatherCode: numberValue(current.weather_code),
      isDay: numberValue(current.is_day, 1),
    },
    daily: dates.map((date, index) => ({
      date: String(date),
      weatherCode: numberAt(daily.weather_code, index),
      temperatureMax: numberAt(daily.temperature_2m_max, index),
      temperatureMin: numberAt(daily.temperature_2m_min, index),
      precipitation: numberAt(daily.precipitation_sum, index),
      precipitationProbability: numberAt(daily.precipitation_probability_max, index),
      sunrise: stringAt(daily.sunrise, index),
      sunset: stringAt(daily.sunset, index),
      sunshineDuration: numberAt(daily.sunshine_duration, index),
      windSpeedMax: numberAt(daily.wind_speed_10m_max, index),
    })),
    fetchedAt: new Date().toISOString(),
  };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Request failed');
  return response.json() as Promise<T>;
}

export async function fetchGrassWeather(location: WeatherLocation): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
  });
  return normalizeWeather(await getJson<OpenMeteoPayload>(`/api/grass-manager/weather?${params}`));
}

export async function searchGrassLocations(query: string): Promise<LocationSearchResult[]> {
  const response = await getJson<{ locations?: LocationSearchResult[] }>(
    `/api/grass-manager/locations?q=${encodeURIComponent(query)}`,
  );
  return response.locations ?? [];
}

export async function fetchGrassTips(): Promise<TipCard[]> {
  const response = await getJson<{ cards?: TipCard[] }>('/api/grass-manager/tips');
  return response.cards ?? [];
}
