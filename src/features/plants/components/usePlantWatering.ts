'use client';

import { useEffect, useState } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import type { Plant, WateringWeightInput } from '../lib/types';

/**
 * The widget's plants and the watering flow over them. Watering is confirmed
 * through a modal (the weights are recorded at the same time), so the plant
 * being watered is state rather than a fire-and-forget action.
 */
export function usePlantWatering() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [wateringPlant, setWateringPlant] = useState<Plant | null>(null);
  const [wateringSaving, setWateringSaving] = useState(false);

  useEffect(() => {
    let active = true;
    plantsApi.list().then((result) => {
      if (!active) {
        return;
      }
      if (result.success) {
        setPlants(result.data ?? []);
        setError(null);
      } else {
        setError(result.error ?? 'Could not load plants.');
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  function openWatering(plant: Plant) {
    setError(null);
    setWateringPlant(plant);
  }

  function closeWatering() {
    if (!wateringSaving) {
      setWateringPlant(null);
    }
  }

  async function submitWatering(weights: WateringWeightInput) {
    if (!wateringPlant) {
      return;
    }

    setPendingId(wateringPlant.id);
    setWateringSaving(true);
    const result = await plantsApi.addEvent(wateringPlant.id, { type: 'watered', ...weights });
    setPendingId(null);
    setWateringSaving(false);
    if (result.success && result.data) {
      const updated = result.data;
      setPlants((current) =>
        current.map((plant) => (plant.id === updated.id ? updated : plant)),
      );
      setWateringPlant(null);
    } else {
      setError(result.error ?? 'Could not water that plant.');
    }
  }

  return {
    plants,
    loading,
    error,
    pendingId,
    wateringPlant,
    wateringSaving,
    openWatering,
    closeWatering,
    submitWatering,
  };
}
