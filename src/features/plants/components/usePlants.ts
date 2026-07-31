'use client';

import { useEffect, useState } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import type { Plant } from '../lib/types';

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    plantsApi.list().then((result) => {
      if (!active) {
        return;
      }
      if (result.success) {
        setPlants(result.data ?? []);
        setLoadError(null);
      } else {
        setLoadError(result.error ?? 'Could not load your plants.');
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function retryLoad() {
    setReloadKey((key) => key + 1);
  }

  function addPlant(created: Plant) {
    setPlants((current) => [...current, created]);
  }

  function handleChanged(updated: Plant) {
    setPlants((current) => current.map((plant) => (plant.id === updated.id ? updated : plant)));
  }

  function handleRemoved(id: string) {
    setPlants((current) => current.filter((plant) => plant.id !== id));
  }

  return { plants, loading, loadError, retryLoad, addPlant, handleChanged, handleRemoved };
}
