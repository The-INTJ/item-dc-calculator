'use client';

import { useEffect, useState } from 'react';

import { fetchGrassWeather } from '../lib/grassApi';
import type { WeatherLocation, WeatherSnapshot } from '../lib/types';

export function useGrassWeather(location: WeatherLocation | null) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshWeather() {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      setWeather(await fetchGrassWeather(location));
    } catch {
      setError('Weather is unavailable right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!location) {
      setWeather(null);
      setError(null);
      return;
    }
    void refreshWeather();
    // Refreshing when the selected coordinates change is intentional.
  }, [location]);

  return { weather, weatherLoading: loading, weatherError: error, refreshWeather };
}
