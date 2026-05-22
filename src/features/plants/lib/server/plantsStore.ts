/**
 * Server-only data access for the plant tracker.
 *
 * All plant data lives in a single top-level Firestore collection. Every care
 * event is appended to an `events` array on the plant document, so a single
 * read returns the whole history needed for stats. Writes run through the
 * Firebase Admin SDK (reused from the contest feature), which bypasses security
 * rules — the collection is therefore locked down for direct client access.
 */

import 'server-only';
import { randomUUID } from 'node:crypto';

import { getFirebaseAdminFirestore } from '@/contest/lib/firebase/admin';

import type { Plant, PlantEvent, PlantEventType, ProviderResult } from '../types';

const COLLECTION = 'plants';

interface PlantDoc {
  name?: unknown;
  createdAt?: unknown;
  events?: unknown;
}

function ok<T>(data: T): ProviderResult<T> {
  return { success: true, data };
}

function fail<T = never>(error: string): ProviderResult<T> {
  return { success: false, error };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeEvents(value: unknown): PlantEvent[] {
  return Array.isArray(value) ? (value as PlantEvent[]) : [];
}

function toPlant(id: string, data: PlantDoc): Plant {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Unnamed plant',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
    events: normalizeEvents(data.events),
  };
}

export async function listPlants(): Promise<ProviderResult<Plant[]>> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return fail('Plant storage is not configured');
  }
  try {
    const snapshot = await db.collection(COLLECTION).get();
    const plants = snapshot.docs
      .map((doc) => toPlant(doc.id, doc.data() as PlantDoc))
      .sort((a, b) => a.createdAt - b.createdAt);
    return ok(plants);
  } catch (error) {
    return fail(describeError(error));
  }
}

export async function getPlant(id: string): Promise<ProviderResult<Plant>> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return fail('Plant storage is not configured');
  }
  try {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) {
      return fail('Plant not found');
    }
    return ok(toPlant(doc.id, doc.data() as PlantDoc));
  } catch (error) {
    return fail(describeError(error));
  }
}

export async function createPlant(name: string): Promise<ProviderResult<Plant>> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return fail('Plant storage is not configured');
  }
  try {
    const ref = db.collection(COLLECTION).doc();
    const plant: Plant = { id: ref.id, name, createdAt: Date.now(), events: [] };
    await ref.set({ name: plant.name, createdAt: plant.createdAt, events: plant.events });
    return ok(plant);
  } catch (error) {
    return fail(describeError(error));
  }
}

export async function updatePlant(
  id: string,
  name: string,
): Promise<ProviderResult<Plant>> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return fail('Plant storage is not configured');
  }
  try {
    const ref = db.collection(COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return fail('Plant not found');
    }
    await ref.update({ name });
    return ok(toPlant(id, { ...(doc.data() as PlantDoc), name }));
  } catch (error) {
    return fail(describeError(error));
  }
}

export async function deletePlant(id: string): Promise<ProviderResult<void>> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return fail('Plant storage is not configured');
  }
  try {
    const ref = db.collection(COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return fail('Plant not found');
    }
    await ref.delete();
    return { success: true };
  } catch (error) {
    return fail(describeError(error));
  }
}

/** Append a care event (watering / nutrition / replant) to a plant. */
export async function addEvent(
  id: string,
  type: PlantEventType,
): Promise<ProviderResult<Plant>> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return fail('Plant storage is not configured');
  }
  try {
    const ref = db.collection(COLLECTION).doc(id);
    const event: PlantEvent = { id: randomUUID(), type, at: Date.now() };
    const plant = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) {
        throw new Error('Plant not found');
      }
      const data = doc.data() as PlantDoc;
      const events = [...normalizeEvents(data.events), event];
      tx.update(ref, { events });
      return toPlant(id, { ...data, events });
    });
    return ok(plant);
  } catch (error) {
    return fail(describeError(error));
  }
}

/** Remove a single logged event — used to undo an accidental tap. */
export async function deleteEvent(
  id: string,
  eventId: string,
): Promise<ProviderResult<Plant>> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return fail('Plant storage is not configured');
  }
  try {
    const ref = db.collection(COLLECTION).doc(id);
    const plant = await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists) {
        throw new Error('Plant not found');
      }
      const data = doc.data() as PlantDoc;
      const existing = normalizeEvents(data.events);
      const events = existing.filter((event) => event.id !== eventId);
      if (events.length === existing.length) {
        throw new Error('Event not found');
      }
      tx.update(ref, { events });
      return toPlant(id, { ...data, events });
    });
    return ok(plant);
  } catch (error) {
    return fail(describeError(error));
  }
}
