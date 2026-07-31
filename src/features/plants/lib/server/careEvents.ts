/**
 * Construction and adjustment of care events: building a new timestamped
 * event from input and applying optional watering weights.
 */

import 'server-only';
import { randomUUID } from 'node:crypto';

import type {
  PlantEvent,
  PlantEventInput,
  PlantEventType,
  WateringWeightInput,
} from '../types';

function normalizeWeight(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function isWateringType(type: PlantEventType): boolean {
  return type === 'watered' || type === 'watered_nutrition';
}

export function applyWateringWeights<T extends PlantEvent>(
  event: T,
  input: WateringWeightInput,
): T {
  const next = { ...event };
  const weightBefore = normalizeWeight(input.weightBefore);
  const weightAfter = normalizeWeight(input.weightAfter);

  if (weightBefore) {
    next.weightBefore = weightBefore;
  } else {
    delete next.weightBefore;
  }

  if (weightAfter) {
    next.weightAfter = weightAfter;
  } else {
    delete next.weightAfter;
  }

  return next;
}

export function buildEvent(input: PlantEventInput | PlantEventType): PlantEvent {
  const payload = typeof input === 'string' ? { type: input } : input;
  let event: PlantEvent = { id: randomUUID(), type: payload.type, at: Date.now() };

  if (isWateringType(payload.type)) {
    event = applyWateringWeights(event, payload);
  }

  if (payload.type === 'note' && payload.note) {
    event.note = payload.note;
  }
  if (payload.type === 'vibe_check' && typeof payload.rating === 'number') {
    event.rating = payload.rating;
  }

  return event;
}
