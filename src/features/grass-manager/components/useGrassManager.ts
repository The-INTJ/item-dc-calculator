'use client';

import { useRef, useState } from 'react';

import { dateInYard } from '../lib/careHistory';
import { searchGrassLocations } from '../lib/grassApi';
import { YARD_SEGMENTS } from '../lib/yard';
import { buildWateringOutlook, combineYardOutlooks } from '../lib/watering';
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
  const [locationError, setLocationError] = useState('');
  const searchId = useRef(0);
  const segments = YARD_SEGMENTS.map((segment) => ({ ...segment, ...data.state.zones[segment.id] }));
  const selectedSegment = segments.find((segment) => segment.id === data.state.selectedSegmentId) ?? null;
  const now = new Date();
  const today = dateInYard(now, weatherData.weather?.timezone);
  const outlooks = weatherData.weather ? segments.map((segment) => ({
    segment, days: buildWateringOutlook(weatherData.weather!, data.state.profile, segment, data.state.events, now),
  })) : [];
  const outlook = combineYardOutlooks(outlooks);
  const selectedPlan = outlooks.find((item) => item.segment.id === selectedSegment?.id)?.days[0] ?? null;

  async function findLocations(query: string) {
    const id = ++searchId.current;
    if (query.trim().length < 2) { setLocationResults([]); return; }
    setLocationLoading(true);
    setLocationError('');
    try {
      const results = await searchGrassLocations(query);
      if (id !== searchId.current) return;
      setLocationResults(results);
      if (!results.length) setLocationError('No towns found. Try a nearby city.');
    } catch { if (id === searchId.current) setLocationError('Location search unavailable. Try again.'); }
    finally { if (id === searchId.current) setLocationLoading(false); }
  }

  function chooseLocation(location: WeatherLocation) {
    searchId.current += 1;
    const locationName = [location.name, location.admin1, location.country].filter(Boolean).join(', ');
    data.updateProfile({ location, locationName });
    setLocationResults([]);
    setLocationLoading(false);
    setLocationError('');
  }

  return {
    ...data, ...weatherData, ...tipData, locationResults, locationLoading, locationError,
    segments, selectedSegment, selectedPlan, outlook, today, findLocations, chooseLocation,
  };
}
