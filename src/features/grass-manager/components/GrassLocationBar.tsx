'use client';

import { useRef, useState } from 'react';
import type { LocationSearchResult, WeatherLocation } from '../lib/types';
import styles from './GrassManagerView.module.scss';

interface Props {
  locationName: string; results: LocationSearchResult[]; loading: boolean; error: string;
  onSearch: (query: string) => void; onChoose: (location: WeatherLocation) => void;
}

export function GrassLocationBar({ locationName, results, loading, error, onSearch, onChoose }: Props) {
  const [draft, setDraft] = useState('');
  const [geoError, setGeoError] = useState('');
  const details = useRef<HTMLDetailsElement>(null);
  function choose(location: WeatherLocation) {
    onChoose(location);
    if (details.current) details.current.open = false;
    setGeoError('');
  }
  function useCurrentLocation() {
    setGeoError('');
    if (!navigator.geolocation) { setGeoError('Search for a town; location services are unavailable.'); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => choose({ name: 'Current location', latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => setGeoError('Location unavailable. Search for a town instead.'),
      { enableHighAccuracy: false, timeout: 8_000 },
    );
  }
  return (
    <details ref={details} className={styles.locationPicker} open={!locationName}>
      <summary>{locationName || 'Set weather location'}</summary>
      <div className={styles.locationMenu}>
        <form className={styles.locationForm} onSubmit={(event) => { event.preventDefault(); onSearch(draft); }}>
          <label className={styles.field}>Town or ZIP code<input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="City or ZIP" autoComplete="address-level2" /></label>
          <button type="submit" disabled={loading || draft.trim().length < 2}>{loading ? 'Searching…' : 'Search'}</button>
          <button type="button" className={styles.textButton} onClick={useCurrentLocation}>Use my location</button>
        </form>
        {(geoError || error) && <p className={styles.inlineError} role="alert">{geoError || error}</p>}
        {results.length > 0 && <ul className={styles.locationResults}>{results.map((result) => (
          <li key={`${result.id ?? result.name}-${result.latitude}`}><button type="button" onClick={() => choose(result)}>{result.name}<small>{[result.admin1, result.country].filter(Boolean).join(', ')}</small></button></li>
        ))}</ul>}
      </div>
    </details>
  );
}
