import type { LocationSearchResult, TipCard, WeatherLocation, WeatherSnapshot } from './types';
import { normalizeWeather, type OpenMeteoPayload } from './weatherData';

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Request failed');
  return response.json() as Promise<T>;
}

export async function fetchGrassWeather(location: WeatherLocation, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude) });
  return normalizeWeather(await getJson<OpenMeteoPayload>(`/api/grass-manager/weather?${params}`, signal));
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
