import 'server-only';

import { getFirebaseAdminFirestore } from '@/contest/lib/firebase/admin';

import { GRASS_TIP_CARDS, mergeTipCards } from '../tips';
import type { TipCard } from '../types';

const COLLECTION = 'grassManagerTips';

function ok<T>(data: T) {
  return { success: true as const, data };
}

function fail(error: unknown) {
  return { success: false as const, error: error instanceof Error ? error.message : String(error) };
}

function asTipCard(id: string, data: Record<string, unknown>): TipCard | null {
  if (typeof data.title !== 'string' || typeof data.summary !== 'string' || typeof data.body !== 'string') {
    return null;
  }
  const category = ['water', 'grow', 'weeds', 'sun', 'soil'].includes(String(data.category))
    ? data.category as TipCard['category']
    : 'grow';
  return {
    id,
    title: data.title,
    summary: data.summary,
    body: data.body,
    category,
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    source: typeof data.source === 'string' ? data.source : undefined,
  };
}

export async function listTipCards() {
  const db = getFirebaseAdminFirestore();
  if (!db) return ok(GRASS_TIP_CARDS);
  try {
    const snapshot = await db.collection(COLLECTION).get();
    const overrides = snapshot.docs
      .map((doc) => asTipCard(doc.id, doc.data() as Record<string, unknown>))
      .filter((card): card is TipCard => card !== null);
    return ok(mergeTipCards(overrides));
  } catch (error) {
    return fail(error);
  }
}

export async function createTipCard(input: Omit<TipCard, 'id' | 'updatedAt'> & { id?: string }) {
  const db = getFirebaseAdminFirestore();
  if (!db) return fail('Tip-card storage is not configured');
  try {
    const ref = input.id ? db.collection(COLLECTION).doc(input.id) : db.collection(COLLECTION).doc();
    const card: TipCard = { ...input, id: ref.id, updatedAt: new Date().toISOString() };
    await ref.set(card, { merge: true });
    return ok(card);
  } catch (error) {
    return fail(error);
  }
}

export async function updateTipCard(id: string, patch: Partial<Omit<TipCard, 'id'>>) {
  const db = getFirebaseAdminFirestore();
  if (!db) return fail('Tip-card storage is not configured');
  try {
    const ref = db.collection(COLLECTION).doc(id);
    const existing = await ref.get();
    if (!existing.exists && !GRASS_TIP_CARDS.some((card) => card.id === id)) return fail('Tip card not found');
    const current = existing.exists ? asTipCard(id, existing.data() as Record<string, unknown>) : GRASS_TIP_CARDS.find((card) => card.id === id);
    const card: TipCard = {
      ...(current ?? GRASS_TIP_CARDS[0]),
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    await ref.set(card, { merge: true });
    return ok(card);
  } catch (error) {
    return fail(error);
  }
}
