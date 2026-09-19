'use client';

import { useEffect, useState } from 'react';

import { fetchGrassWeather } from '../lib/grassApi';
import type { WeatherLocation, WeatherSnapshot } from '../lib/types';

export function useGrassWeather(location: WeatherLocation | null) {
  const [result, setResult] = useState<{ key: string; weather: WeatherSnapshot | null; error: string | null } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const key = location ? `${location.latitude},${location.longitude}` : '';
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setResult(null);
    void fetchGrassWeather({ name: '', latitude, longitude }, controller.signal)
      .then((weather) => { if (active) setResult({ key, weather, error: null }); })
      .catch(() => {
        if (active) setResult({ key, weather: null, error: 'Forecast unavailable. Check soil before watering; try refreshing.' });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [key, latitude, longitude, refresh]);

  useEffect(() => {
    const tick = () => setRefresh((value) => value + 1);
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    const timer = window.setInterval(tick, 30 * 60_000);
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const current = result?.key === key ? result : null;
  return {
    weather: current?.weather ?? null, weatherLoading: Boolean(key) && loading,
    weatherError: current?.error ?? null, refreshWeather: () => setRefresh((value) => value + 1),
  };
}
