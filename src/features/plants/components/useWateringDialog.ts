'use client';

import { useState } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import type { Plant, PlantEvent, WateringWeightInput } from '../lib/types';

export type WateringDialogState =
  | { mode: 'create' }
  | { mode: 'edit'; event: PlantEvent };

interface WateringDialogDeps {
  plant: Plant;
  onChanged: (plant: Plant) => void;
  setError: (error: string | null) => void;
}

export function useWateringDialog({ plant, onChanged, setError }: WateringDialogDeps) {
  const [wateringDialog, setWateringDialog] = useState<WateringDialogState | null>(null);
  const [wateringSaving, setWateringSaving] = useState(false);

  function openWateringDialog() {
    setError(null);
    setWateringDialog({ mode: 'create' });
  }

  function openWateringEdit(event: PlantEvent) {
    setError(null);
    setWateringDialog({ mode: 'edit', event });
  }

  function closeWateringDialog() {
    if (!wateringSaving) {
      setWateringDialog(null);
    }
  }

  async function submitWateringWeights(weights: WateringWeightInput) {
    const dialog = wateringDialog;
    if (!dialog) {
      return;
    }

    setWateringSaving(true);
    setError(null);
    const result =
      dialog.mode === 'create'
        ? await plantsApi.addEvent(plant.id, { type: 'watered', ...weights })
        : await plantsApi.updateEventWeights(plant.id, dialog.event.id, weights);
    setWateringSaving(false);
    if (result.success && result.data) {
      onChanged(result.data);
      setWateringDialog(null);
    } else {
      setError(result.error ?? 'Could not save watering weights.');
    }
  }

  return {
    wateringDialog,
    wateringSaving,
    openWateringDialog,
    openWateringEdit,
    closeWateringDialog,
    submitWateringWeights,
  };
}
