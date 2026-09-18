'use client';

import { useState } from 'react';

import { searchGrassLocations } from '../lib/grassApi';
import { deriveGrassInsights } from '../lib/grassInsights';
import { getSegment } from '../lib/yard';
import { evaluateWateringPlan } from '../lib/weatherRules';
import type { LocationSearchResult, WeatherLocation } from '../lib/types';
import { useGrassState } from './useGrassState';
import { useGrassTips } from './useGrassTips';
import { useGrassWeather } from './useGrassWeather';

export function useGrassManager() {
  const data = useGrassState();
  const weatherData = useGrassWeather(data.state.profile.location);
  const tipData = useGrassTips();
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const selectedSegment = getSegment(data.state.selectedSegmentId);
  const now = new Date();
  const plan = weatherData.weather?.daily[0]
    ? evaluateWateringPlan(weatherData.weather.daily[0], data.state.profile, selectedSegment, data.state.events, now)
    : null;
  const insights = deriveGrassInsights(data.state.profile, selectedSegment, data.state.events, now);

  async function findLocations(query: string) {
    if (query.trim().length < 2) {
      setLocationResults([]);
      return;
    }
    setLocationLoading(true);
    try { setLocationResults(await searchGrassLocations(query)); }
    catch { setLocationResults([]); }
    finally { setLocationLoading(false); }
  }

  function chooseLocation(location: WeatherLocation) {
    const locationName = [location.name, location.admin1, location.country].filter(Boolean).join(', ');
    data.updateProfile({ location, locationName });
    setLocationResults([]);
  }

  return {
    ...data,
    ...weatherData,
    ...tipData,
    locationResults,
    locationLoading,
    selectedSegment,
    plan,
    insights,
    findLocations,
    chooseLocation,
  };
}
