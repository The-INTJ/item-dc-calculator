'use client';

import { useState, type FormEvent } from 'react';

import { plantsApi } from '../lib/api/plantsApi';
import type { Plant, PlantEventType } from '../lib/types';

export interface PlantActionDeps {
  plant: Plant;
  onChanged: (plant: Plant) => void;
  setError: (error: string | null) => void;
}

export function usePlantEventLog({ plant, onChanged, setError }: PlantActionDeps) {
  const [pendingType, setPendingType] = useState<PlantEventType | null>(null);

  async function logEvent(type: PlantEventType) {
    setPendingType(type);
    setError(null);
    const result = await plantsApi.addEvent(plant.id, type);
    setPendingType(null);
    if (result.success && result.data) {
      onChanged(result.data);
    } else {
      setError(result.error ?? 'Could not save that action.');
    }
  }

  async function removeEvent(eventId: string) {
    setError(null);
    const result = await plantsApi.deleteEvent(plant.id, eventId);
    if (result.success && result.data) {
      onChanged(result.data);
    } else {
      setError(result.error ?? 'Could not remove that entry.');
    }
  }

  return { pendingType, logEvent, removeEvent };
}

export function usePlantJournal({ plant, onChanged, setError }: PlantActionDeps) {
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [vibeDraft, setVibeDraft] = useState('');
  const [vibeSaving, setVibeSaving] = useState(false);

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = noteDraft.trim();
    if (!trimmed) {
      setError('Write a note before submitting.');
      return;
    }

    setNoteSaving(true);
    setError(null);
    const result = await plantsApi.addNote(plant.id, trimmed);
    setNoteSaving(false);
    if (result.success && result.data) {
      onChanged(result.data);
      setNoteDraft('');
    } else {
      setError(result.error ?? 'Could not save that note.');
    }
  }

  async function submitVibe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (vibeDraft.trim() === '') {
      setError('Enter a whole number from 0 to 10.');
      return;
    }
    const rating = Number(vibeDraft);
    if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
      setError('Enter a whole number from 0 to 10.');
      return;
    }

    setVibeSaving(true);
    setError(null);
    const result = await plantsApi.addVibeCheck(plant.id, rating);
    setVibeSaving(false);
    if (result.success && result.data) {
      onChanged(result.data);
      setVibeDraft('');
    } else {
      setError(result.error ?? 'Could not save that vibe check.');
    }
  }

  return {
    noteDraft,
    setNoteDraft,
    noteSaving,
    showAllNotes,
    setShowAllNotes,
    vibeDraft,
    setVibeDraft,
    vibeSaving,
    submitNote,
    submitVibe,
  };
}

export function usePlantManageActions({
  plant,
  onChanged,
  onRemoved,
  setError,
}: PlantActionDeps & { onRemoved: (id: string) => void }) {
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(plant.name);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === plant.name) {
      setRenaming(false);
      setNameDraft(plant.name);
      return;
    }
    const result = await plantsApi.rename(plant.id, trimmed);
    if (result.success && result.data) {
      onChanged(result.data);
      setRenaming(false);
    } else {
      setError(result.error ?? 'Could not rename the plant.');
    }
  }

  async function confirmRemove() {
    setRemoving(true);
    setError(null);
    const result = await plantsApi.remove(plant.id);
    if (result.success) {
      onRemoved(plant.id);
    } else {
      setRemoving(false);
      setConfirmingRemove(false);
      setError(result.error ?? 'Could not remove the plant.');
    }
  }

  return {
    renaming,
    setRenaming,
    nameDraft,
    setNameDraft,
    confirmingRemove,
    setConfirmingRemove,
    removing,
    submitRename,
    confirmRemove,
  };
}
