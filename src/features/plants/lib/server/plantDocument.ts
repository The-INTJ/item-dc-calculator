/**
 * Firestore document shape for a plant and the mapping from raw document data
 * to the domain `Plant` type.
 */

import 'server-only';

import type { Plant, PlantEvent } from '../types';

export interface PlantDoc {
  name?: unknown;
  createdAt?: unknown;
  events?: unknown;
}

export function normalizeEvents(value: unknown): PlantEvent[] {
  return Array.isArray(value) ? (value as PlantEvent[]) : [];
}

export function toPlant(id: string, data: PlantDoc): Plant {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Unnamed plant',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
    events: normalizeEvents(data.events),
  };
}
