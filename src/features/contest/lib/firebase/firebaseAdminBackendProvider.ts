/**
 * Server-side Firebase backend provider implemented with the Admin SDK.
 *
 * API routes use this provider so Firestore access is no longer gated by
 * browser security rules for public/admin operations.
 */

import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { BackendProvider, ConfigsProvider, Contest, ContestConfigItem, ContestsProvider, EntriesProvider, Entry, ProviderResult, ScoreBreakdown, ScoreEntry, ScoresProvider, Voter, VotersProvider } from '../helpers/types';
import { error, generateId, success } from '../helpers/providerUtils';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from './admin';
import { DEFAULT_CONFIGS } from './defaultConfigs';

const CONTESTS_COLLECTION = 'contests';
const CONFIGS_COLLECTION = 'configs';
const VOTES_SUBCOLLECTION = 'votes';

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripUndefinedDeep<T>(value: T): T {
  if (value instanceof FieldValue || value instanceof Timestamp) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)).filter((item) => item !== undefined) as T;
  }

  if (!isRecord(value)) {
    return value;
  }

  const entries = Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .map(([key, item]) => [key, stripUndefinedDeep(item)]);

  return Object.fromEntries(entries) as T;
}

function withTimestamps<T extends Record<string, unknown>>(value: T): T {
  return stripUndefinedDeep({
    ...value,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  } as T);
}

function withUpdatedAt<T extends Record<string, unknown>>(value: T): T {
  return stripUndefinedDeep({
    ...value,
    updatedAt: FieldValue.serverTimestamp(),
  } as T);
}

function normalizeContestDoc(id: string, data: Record<string, unknown>): Contest {
  return {
    ...data,
    id,
    voters: (data.voters ?? data.judges ?? []) as Voter[],
  } as Contest;
}

function docToScoreEntry(docId: string, data: Record<string, unknown>): ScoreEntry {
  return {
    id: docId,
    entryId: (data.entryId as string) ?? '',
    userId: (data.userId as string) ?? '',
    round: (data.round as string) ?? '',
    breakdown: (data.breakdown as ScoreBreakdown) ?? {},
    ...(data.notes ? { notes: data.notes as string } : {}),
  };
}

function computeVoteTotal(breakdown: ScoreBreakdown): number {
  const values = Object.values(breakdown).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );

  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function makeVoteDocId(userId: string, entryId: string): string {
  return `${userId}_${entryId}`;
}

async function seedDefaultConfigsIfEmpty(db: Firestore): Promise<void> {
  const snapshot = await db.collection(CONFIGS_COLLECTION).limit(1).get();
  if (!snapshot.empty) {
    return;
  }

  const batch = db.batch();
  for (const config of DEFAULT_CONFIGS) {
    batch.set(db.collection(CONFIGS_COLLECTION).doc(config.id), config);
  }
  await batch.commit();
}

async function getContestById(db: Firestore, contestId: string): Promise<Contest | null> {
  const snapshot = await db.collection(CONTESTS_COLLECTION).doc(contestId).get();
  if (!snapshot.exists) {
    return null;
  }

  return normalizeContestDoc(snapshot.id, snapshot.data() as Record<string, unknown>);
}

async function updateContestDocument(db: Firestore, contestId: string, updates: Partial<Contest>): Promise<void> {
  await db.collection(CONTESTS_COLLECTION).doc(contestId).update(withUpdatedAt(updates as Record<string, unknown>));
}

interface ArrayEntityProvider<T extends { id: string }> {
  listByContest(contestId: string): Promise<ProviderResult<T[]>>;
  getById(contestId: string, entityId: string): Promise<ProviderResult<T | null>>;
  create(contestId: string, input: Omit<T, 'id'> & { id?: string }): Promise<ProviderResult<T>>;
  update(contestId: string, entityId: string, updates: Partial<T>): Promise<ProviderResult<T>>;
  delete(contestId: string, entityId: string): Promise<ProviderResult<void>>;
}

function createArrayEntityProvider<T extends { id: string }>(options: {
  getDb: () => Firestore | null;
  getItems: (contest: Contest) => T[];
  toUpdates: (items: T[]) => Partial<Contest>;
  entityName: string;
  idPrefix: string;
}): ArrayEntityProvider<T> {
  const { getDb, getItems, toUpdates, entityName, idPrefix } = options;

  return {
    async listByContest(contestId: string): Promise<ProviderResult<T[]>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const contest = await getContestById(db, contestId);
        if (!contest) {
          return error('Contest not found');
        }
        return success(getItems(contest));
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async getById(contestId: string, entityId: string): Promise<ProviderResult<T | null>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const contest = await getContestById(db, contestId);
        if (!contest) {
          return error('Contest not found');
        }

        const item = getItems(contest).find((candidate) => candidate.id === entityId) ?? null;
        return success(item);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async create(contestId: string, input: Omit<T, 'id'> & { id?: string }): Promise<ProviderResult<T>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const contest = await getContestById(db, contestId);
        if (!contest) {
          return error('Contest not found');
        }

        const item = { ...input, id: input.id ?? generateId(idPrefix) } as T;
        await updateContestDocument(db, contestId, toUpdates([...getItems(contest), item]));
        return success(item);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async update(contestId: string, entityId: string, updates: Partial<T>): Promise<ProviderResult<T>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const contest = await getContestById(db, contestId);
        if (!contest) {
          return error('Contest not found');
        }

        const items = getItems(contest);
        const index = items.findIndex((candidate) => candidate.id === entityId);
        if (index === -1) {
          return error(`${entityName} not found`);
        }

        const updated = { ...items[index], ...updates } as T;
        const nextItems = [...items];
        nextItems[index] = updated;
        await updateContestDocument(db, contestId, toUpdates(nextItems));
        return success(updated);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async delete(contestId: string, entityId: string): Promise<ProviderResult<void>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const contest = await getContestById(db, contestId);
        if (!contest) {
          return error('Contest not found');
        }

        const nextItems = getItems(contest).filter((candidate) => candidate.id !== entityId);
        await updateContestDocument(db, contestId, toUpdates(nextItems));
        return success(undefined);
      } catch (err) {
        return error(toMessage(err));
      }
    },
  };
}

function createContestsProvider(getDb: () => Firestore | null): ContestsProvider {
  return {
    async list(): Promise<ProviderResult<Contest[]>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const snapshot = await db.collection(CONTESTS_COLLECTION).get();
        const contests = snapshot.docs.map((docSnap) => normalizeContestDoc(docSnap.id, docSnap.data() as Record<string, unknown>));
        return success(contests);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async getBySlug(slug: string): Promise<ProviderResult<Contest | null>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const snapshot = await db.collection(CONTESTS_COLLECTION).where('slug', '==', slug).limit(1).get();
        if (snapshot.empty) {
          return success(null);
        }

        const match = snapshot.docs[0];
        return success(normalizeContestDoc(match.id, match.data() as Record<string, unknown>));
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async getDefault(): Promise<ProviderResult<Contest | null>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const snapshot = await db.collection(CONTESTS_COLLECTION).where('defaultContest', '==', true).limit(1).get();
        if (snapshot.empty) {
          return success(null);
        }

        const match = snapshot.docs[0];
        return success(normalizeContestDoc(match.id, match.data() as Record<string, unknown>));
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async create(input): Promise<ProviderResult<Contest>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const id = generateId('contest');
        const newContest: Contest = {
          id,
          name: input.name,
          slug: input.slug,
          phase: 'set',
          config: input.config,
          entries: [],
          voters: [],
        };

        await db.collection(CONTESTS_COLLECTION).doc(id).set(withTimestamps(newContest as unknown as Record<string, unknown>));
        return success(newContest);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async update(id, updates): Promise<ProviderResult<Contest>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const existing = await getContestById(db, id);
        if (!existing) {
          return error('Contest not found');
        }

        await updateContestDocument(db, id, updates);
        const updated = await getContestById(db, id);
        if (!updated) {
          return error('Contest not found');
        }

        return success(updated);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async delete(id): Promise<ProviderResult<void>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const voteSnapshot = await db.collection(CONTESTS_COLLECTION).doc(id).collection(VOTES_SUBCOLLECTION).get();
        if (!voteSnapshot.empty) {
          const batch = db.batch();
          voteSnapshot.docs.forEach((voteDoc) => {
            batch.delete(voteDoc.ref);
          });
          await batch.commit();
        }

        await db.collection(CONTESTS_COLLECTION).doc(id).delete();
        return success(undefined);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async setDefault(id): Promise<ProviderResult<Contest>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const contestsSnapshot = await db.collection(CONTESTS_COLLECTION).where('defaultContest', '==', true).get();
        const batch = db.batch();

        contestsSnapshot.docs.forEach((contestDoc) => {
          batch.update(contestDoc.ref, withUpdatedAt({ defaultContest: false }));
        });

        batch.update(db.collection(CONTESTS_COLLECTION).doc(id), withUpdatedAt({ defaultContest: true }));
        await batch.commit();

        const updated = await getContestById(db, id);
        if (!updated) {
          return error('Contest not found');
        }

        return success(updated);
      } catch (err) {
        return error(toMessage(err));
      }
    },
  };
}

function createScoresProvider(getDb: () => Firestore | null): ScoresProvider {
  return {
    async listByEntry(contestId, entryId): Promise<ProviderResult<ScoreEntry[]>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const snapshot = await db.collection(CONTESTS_COLLECTION).doc(contestId).collection(VOTES_SUBCOLLECTION).where('entryId', '==', entryId).get();
        return success(snapshot.docs.map((docSnap) => docToScoreEntry(docSnap.id, docSnap.data() as Record<string, unknown>)));
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async listByUser(contestId, userId): Promise<ProviderResult<ScoreEntry[]>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const snapshot = await db.collection(CONTESTS_COLLECTION).doc(contestId).collection(VOTES_SUBCOLLECTION).where('userId', '==', userId).get();
        return success(snapshot.docs.map((docSnap) => docToScoreEntry(docSnap.id, docSnap.data() as Record<string, unknown>)));
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async getById(contestId, scoreId): Promise<ProviderResult<ScoreEntry | null>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const snapshot = await db.collection(CONTESTS_COLLECTION).doc(contestId).collection(VOTES_SUBCOLLECTION).doc(scoreId).get();
        if (!snapshot.exists) {
          return success(null);
        }

        return success(docToScoreEntry(snapshot.id, snapshot.data() as Record<string, unknown>));
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async submit(contestId, input): Promise<ProviderResult<ScoreEntry>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      const voteDocId = makeVoteDocId(input.userId, input.entryId);

      try {
        const result = await db.runTransaction(async (transaction) => {
          const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
          const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(voteDocId);

          const [contestSnap, voteSnap] = await Promise.all([
            transaction.get(contestRef),
            transaction.get(voteRef),
          ]);

          if (!contestSnap.exists) {
            throw new Error('Contest not found');
          }

          const contest = normalizeContestDoc(contestSnap.id, contestSnap.data() as Record<string, unknown>);
          const entryIndex = contest.entries.findIndex((entry) => entry.id === input.entryId);
          if (entryIndex === -1) {
            throw new Error('Entry not found');
          }

          const newTotal = computeVoteTotal(input.breakdown);
          const existingVote = voteSnap.exists ? (voteSnap.data() as Record<string, unknown>) : null;
          const oldBreakdown = (existingVote?.breakdown ?? {}) as ScoreBreakdown;
          const delta = voteSnap.exists ? newTotal - computeVoteTotal(oldBreakdown) : newTotal;
          const isNewVote = !voteSnap.exists;

          const voteData = stripUndefinedDeep({
            userId: input.userId,
            entryId: input.entryId,
            round: input.round,
            breakdown: input.breakdown,
            ...(input.notes ? { notes: input.notes } : {}),
            ...(isNewVote ? { createdAt: FieldValue.serverTimestamp() } : {}),
            updatedAt: FieldValue.serverTimestamp(),
          });

          transaction.set(voteRef, voteData, { merge: true });

          const entries = [...contest.entries];
          const entry = { ...entries[entryIndex] };
          entry.sumScore = (entry.sumScore ?? 0) + delta;
          entry.voteCount = (entry.voteCount ?? 0) + (isNewVote ? 1 : 0);
          entries[entryIndex] = entry;

          transaction.update(contestRef, withUpdatedAt({ entries }));

          return docToScoreEntry(voteDocId, {
            userId: input.userId,
            entryId: input.entryId,
            round: input.round,
            breakdown: input.breakdown,
            ...(input.notes ? { notes: input.notes } : {}),
          });
        });

        return success(result);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async update(contestId, scoreId, updates): Promise<ProviderResult<ScoreEntry>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const result = await db.runTransaction(async (transaction) => {
          const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
          const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(scoreId);

          const [contestSnap, voteSnap] = await Promise.all([
            transaction.get(contestRef),
            transaction.get(voteRef),
          ]);

          if (!contestSnap.exists) {
            throw new Error('Contest not found');
          }
          if (!voteSnap.exists) {
            throw new Error('Vote not found');
          }

          const contest = normalizeContestDoc(contestSnap.id, contestSnap.data() as Record<string, unknown>);
          const existingVote = voteSnap.data() as Record<string, unknown>;
          const entryId = (existingVote.entryId as string) ?? '';
          const entryIndex = contest.entries.findIndex((entry) => entry.id === entryId);
          if (entryIndex === -1) {
            throw new Error('Entry not found');
          }

          const oldBreakdown = (existingVote.breakdown ?? {}) as ScoreBreakdown;
          const newBreakdown: ScoreBreakdown = { ...oldBreakdown };
          if (updates.breakdown) {
            for (const [key, value] of Object.entries(updates.breakdown)) {
              if (typeof value === 'number' && Number.isFinite(value)) {
                newBreakdown[key] = value;
              }
            }
          }

          const delta = computeVoteTotal(newBreakdown) - computeVoteTotal(oldBreakdown);

          transaction.set(voteRef, stripUndefinedDeep({
            breakdown: newBreakdown,
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
            updatedAt: FieldValue.serverTimestamp(),
          }), { merge: true });

          const entries = [...contest.entries];
          const entry = { ...entries[entryIndex] };
          entry.sumScore = (entry.sumScore ?? 0) + delta;
          entries[entryIndex] = entry;
          transaction.update(contestRef, withUpdatedAt({ entries }));

          return docToScoreEntry(scoreId, {
            ...existingVote,
            breakdown: newBreakdown,
            ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
          });
        });

        return success(result);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async delete(contestId, scoreId): Promise<ProviderResult<void>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        await db.runTransaction(async (transaction) => {
          const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
          const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(scoreId);

          const [contestSnap, voteSnap] = await Promise.all([
            transaction.get(contestRef),
            transaction.get(voteRef),
          ]);

          if (!contestSnap.exists) {
            throw new Error('Contest not found');
          }
          if (!voteSnap.exists) {
            throw new Error('Vote not found');
          }

          const contest = normalizeContestDoc(contestSnap.id, contestSnap.data() as Record<string, unknown>);
          const vote = voteSnap.data() as Record<string, unknown>;
          const entryId = (vote.entryId as string) ?? '';
          const entryIndex = contest.entries.findIndex((entry) => entry.id === entryId);
          if (entryIndex === -1) {
            throw new Error('Entry not found');
          }

          const entries = [...contest.entries];
          const entry = { ...entries[entryIndex] };
          entry.sumScore = (entry.sumScore ?? 0) - computeVoteTotal((vote.breakdown ?? {}) as ScoreBreakdown);
          entry.voteCount = Math.max(0, (entry.voteCount ?? 0) - 1);
          entries[entryIndex] = entry;

          transaction.update(contestRef, withUpdatedAt({ entries }));
          transaction.delete(voteRef);
        });

        return success(undefined);
      } catch (err) {
        return error(toMessage(err));
      }
    },
  };
}

function createConfigsProvider(getDb: () => Firestore | null): ConfigsProvider {
  return {
    async list(): Promise<ProviderResult<ContestConfigItem[]>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const snapshot = await db.collection(CONFIGS_COLLECTION).get();
        const configs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ContestConfigItem, 'id'>),
        }));
        return success(configs);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async getById(configId): Promise<ProviderResult<ContestConfigItem | null>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const snapshot = await db.collection(CONFIGS_COLLECTION).doc(configId).get();
        if (!snapshot.exists) {
          return success(null);
        }

        return success({
          id: snapshot.id,
          ...(snapshot.data() as Omit<ContestConfigItem, 'id'>),
        });
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async create(config): Promise<ProviderResult<ContestConfigItem>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        if (!config.topic || !config.attributes || config.attributes.length === 0) {
          return error('Config must have a topic and at least one attribute');
        }

        const id = config.id ?? generateId('config');
        const newConfig: ContestConfigItem = {
          id,
          topic: config.topic,
          attributes: config.attributes,
          ...(config.entryLabel ? { entryLabel: config.entryLabel } : {}),
          ...(config.entryLabelPlural ? { entryLabelPlural: config.entryLabelPlural } : {}),
        };

        await db.collection(CONFIGS_COLLECTION).doc(id).set(stripUndefinedDeep({
          topic: newConfig.topic,
          attributes: newConfig.attributes,
          entryLabel: newConfig.entryLabel,
          entryLabelPlural: newConfig.entryLabelPlural,
        }));

        return success(newConfig);
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async update(configId, updates): Promise<ProviderResult<ContestConfigItem>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const docRef = db.collection(CONFIGS_COLLECTION).doc(configId);
        const existing = await docRef.get();
        if (!existing.exists) {
          return error('Config not found');
        }

        const { id: _ignored, ...rest } = updates;
        await docRef.update(stripUndefinedDeep(rest));
        const updated = await docRef.get();
        return success({
          id: updated.id,
          ...(updated.data() as Omit<ContestConfigItem, 'id'>),
        });
      } catch (err) {
        return error(toMessage(err));
      }
    },

    async delete(configId): Promise<ProviderResult<void>> {
      const db = getDb();
      if (!db) {
        return error('Firebase Admin Firestore not initialized');
      }

      try {
        const docRef = db.collection(CONFIGS_COLLECTION).doc(configId);
        const existing = await docRef.get();
        if (!existing.exists) {
          return error('Config not found');
        }

        await docRef.delete();
        return success(undefined);
      } catch (err) {
        return error(toMessage(err));
      }
    },
  };
}

export function createFirebaseAdminBackendProvider(): BackendProvider {
  let db: Firestore | null = null;

  const getDb = () => db;

  const entriesProvider = createArrayEntityProvider<Entry>({
    getDb,
    getItems: (contest) => contest.entries,
    toUpdates: (entries) => ({ entries }),
    entityName: 'Entry',
    idPrefix: 'entry',
  }) as EntriesProvider;

  const votersProvider = createArrayEntityProvider<Voter>({
    getDb,
    getItems: (contest) => contest.voters ?? [],
    toUpdates: (voters) => ({ voters }),
    entityName: 'Voter',
    idPrefix: 'voter',
  }) as VotersProvider;

  return {
    name: 'firebase-admin',
    contests: createContestsProvider(getDb),
    entries: entriesProvider,
    voters: votersProvider,
    scores: createScoresProvider(getDb),
    configs: createConfigsProvider(getDb),

    async initialize(): Promise<ProviderResult<void>> {
      db = getFirebaseAdminDb();

      if (!isFirebaseAdminConfigured() || !db) {
        console.warn('[FirebaseAdminBackend] Firebase Admin is not configured; server data access is unavailable.');
        return success(undefined);
      }

      try {
        await seedDefaultConfigsIfEmpty(db);
      } catch (err) {
        console.error('[FirebaseAdminBackend] Failed to seed default configs:', err);
      }

      return success(undefined);
    },

    async dispose(): Promise<void> {
      db = null;
    },
  };
}



