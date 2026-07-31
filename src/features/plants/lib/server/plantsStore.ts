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

import { getFirebaseAdminFirestore } from '@/contest/lib/firebase/admin';

import type {
  Plant,
  PlantEventInput,
  PlantEventType,
  ProviderResult,
  WateringWeightInput,
} from '../types';

import { applyWateringWeights, buildEvent, isWateringType } from './careEvents';
import { normalizeEvents, toPlant, type PlantDoc } from './plantDocument';

const COLLECTION = 'plants';

function ok<T>(data: T): ProviderResult<T> {
  return { success: true, data };
}

function fail<T = never>(error: string): ProviderResult<T> {
  return { success: false, error };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

/** Append a timestamped plant event to a plant's history. */
export async function addEvent(
  id: string,
  input: PlantEventInput | PlantEventType,
): Promise<ProviderResult<Plant>> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    return fail('Plant storage is not configured');
  }
  try {
    const ref = db.collection(COLLECTION).doc(id);
    const event = buildEvent(input);
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

/** Update the optional before/after weights on a watering event. */
export async function updateEventWeights(
  id: string,
  eventId: string,
  input: WateringWeightInput,
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
      const index = existing.findIndex((event) => event.id === eventId);
      if (index === -1) {
        throw new Error('Event not found');
      }

      const target = existing[index];
      if (!isWateringType(target.type)) {
        throw new Error('Event is not a watering');
      }

      const events = [...existing];
      events[index] = applyWateringWeights(target, input);
      tx.update(ref, { events });
      return toPlant(id, { ...data, events });
    });
    return ok(plant);
  } catch (error) {
    return fail(describeError(error));
  }
}

/** Remove a single logged event - used to undo an accidental tap. */
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
