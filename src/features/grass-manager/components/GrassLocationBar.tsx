'use client';

import { useState } from 'react';

import type { LocationSearchResult, WeatherLocation } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface GrassLocationBarProps {
  locationName: string;
  results: LocationSearchResult[];
  loading: boolean;
  onSearch: (query: string) => void;
  onChoose: (location: WeatherLocation) => void;
}

export function GrassLocationBar({
  locationName,
  results,
  loading,
  onSearch,
  onChoose,
}: GrassLocationBarProps) {
  const [draft, setDraft] = useState(locationName);
  const [geoError, setGeoError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(draft);
  }

  function useCurrentLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Location services are not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraft('Current location');
        onChoose({
          name: 'Current location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setGeoError('Location permission was unavailable. Search for a city instead.'),
      { enableHighAccuracy: false, timeout: 8_000 },
    );
  }

  return (
    <section className={styles.locationBar} aria-label="Weather location">
      <div className={styles.locationCopy}>
        <span className={styles.eyebrow}>Forecast anchor</span>
        <strong>{locationName || 'Choose a location for weather-aware care'}</strong>
      </div>
      <form className={styles.locationForm} onSubmit={submit}>
        <label className={styles.srOnly} htmlFor="grass-location-search">Search for a city or ZIP code</label>
        <input
          id="grass-location-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="City or ZIP code"
          autoComplete="address-level2"
        />
        <button type="submit" className={styles.smallButton} disabled={loading || draft.trim().length < 2}>
          {loading ? 'Searching…' : 'Search'}
        </button>
        <button type="button" className={styles.ghostButton} onClick={useCurrentLocation}>
          Use my location
        </button>
      </form>
      {geoError && <p className={styles.inlineError}>{geoError}</p>}
      {results.length > 0 && (
        <ul className={styles.locationResults}>
          {results.map((result) => (
            <li key={`${result.id ?? result.name}-${result.latitude}`}>
              <button type="button" onClick={() => { onChoose(result); setDraft(result.name); }}>
                <strong>{result.name}</strong>
                <span>{[result.admin1, result.country].filter(Boolean).join(', ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
