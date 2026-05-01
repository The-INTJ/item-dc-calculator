/**
 * Firestore adapter backed by firebase-admin. Used in API routes on the server.
 *
 * Mirrors the client-SDK adapter in firestoreAdapter.ts, but uses Admin SDK
 * APIs (db.collection().doc(), FieldValue.serverTimestamp(), etc.).
 * The Admin SDK bypasses Firestore security rules by design, which is what
 * lets API routes read/write even though the rules require `signedIn()`
 * for direct client access.
 */

import { FieldValue, type Firestore as AdminFirestore } from 'firebase-admin/firestore';
import type { Contest, ContestConfigItem, Entry, Matchup, ScoreBreakdown, ScoreEntry } from '../../contexts/contest/contestTypes';
import type { MatchupCreateInput, ScoreUpdatePayload, UserProfile } from '../backend/types';
import { generateId } from '../backend/providerUtils';
import { normalizeContest } from '../domain/normalizeContest';
import type { FirestoreAdapter } from './firestoreAdapter';
import { buildInlineEntriesFromContestantIds } from './firestoreAdapter';
import { computeVoteTotal, docToScoreEntry, makeVoteDocId } from './scoreHelpers';

const CONTESTS_COLLECTION = 'contests';
const CONFIGS_COLLECTION = 'configs';
const USERS_COLLECTION = 'users';
const VOTES_SUBCOLLECTION = 'votes';
const MATCHUPS_SUBCOLLECTION = 'matchups';

function normalizeMatchupDoc(contestId: string, id: string, data: Record<string, unknown>): Matchup {
  const { createdAt: _c, updatedAt: _u, ...rest } = data;
  return {
    ...rest,
    id,
    contestId,
    entries: ((rest.entries as Entry[] | undefined) ?? []) as Entry[],
  } as Matchup;
}

export function createFirestoreAdminAdapter(getDb: () => AdminFirestore | null): FirestoreAdapter {
  function requireDb(): AdminFirestore {
    const db = getDb();
    if (!db) throw new Error('Firebase Admin not initialized');
    return db;
  }

  return {
    isReady(): boolean {
      return getDb() !== null;
    },

    // ---- Contests ----

    async getContest(contestId): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db.collection(CONTESTS_COLLECTION).doc(contestId).get();
      if (!snap.exists) return null;

      return normalizeContest(snap.id, snap.data() as Record<string, unknown>);
    },

    async getContestBySlug(slug): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const snapshot = await db.collection(CONTESTS_COLLECTION).where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return normalizeContest(docSnap.id, docSnap.data() as Record<string, unknown>);
    },

    async getDefaultContest(): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const snapshot = await db.collection(CONTESTS_COLLECTION).where('defaultContest', '==', true).limit(1).get();
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return normalizeContest(docSnap.id, docSnap.data() as Record<string, unknown>);
    },

    async listContests(): Promise<Contest[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db.collection(CONTESTS_COLLECTION).get();
      return snapshot.docs.map((docSnap) => normalizeContest(docSnap.id, docSnap.data() as Record<string, unknown>));
    },

    async createContest(id, data): Promise<void> {
      const db = requireDb();
      await db.collection(CONTESTS_COLLECTION).doc(id).set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    },

    async updateContest(contestId, updates): Promise<void> {
      const db = requireDb();
      await db.collection(CONTESTS_COLLECTION).doc(contestId).update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
    },

    async deleteContest(contestId): Promise<void> {
      const db = requireDb();
      await db.collection(CONTESTS_COLLECTION).doc(contestId).delete();
    },

    // ---- Configs ----

    async getConfig(configId): Promise<ContestConfigItem | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db.collection(CONFIGS_COLLECTION).doc(configId).get();
      if (!snap.exists) return null;

      return { id: snap.id, ...snap.data() } as ContestConfigItem;
    },

    async listConfigs(): Promise<ContestConfigItem[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db.collection(CONFIGS_COLLECTION).get();
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ContestConfigItem[];
    },

    async configExists(configId): Promise<boolean> {
      const db = getDb();
      if (!db) return false;

      const snap = await db.collection(CONFIGS_COLLECTION).doc(configId).get();
      return snap.exists;
    },

    async createConfig(id, data): Promise<void> {
      const db = requireDb();
      await db.collection(CONFIGS_COLLECTION).doc(id).set(data);
    },

    async updateConfig(configId, updates): Promise<ContestConfigItem> {
      const db = requireDb();
      const docRef = db.collection(CONFIGS_COLLECTION).doc(configId);
      const existing = await docRef.get();
      if (!existing.exists) throw new Error('Config not found');

      const { id: _ignored, ...updateData } = updates;
      void _ignored;
      await docRef.update(updateData);

      const updated = await docRef.get();
      return { id: updated.id, ...updated.data() } as ContestConfigItem;
    },

    async deleteConfig(configId): Promise<void> {
      const db = requireDb();
      const docRef = db.collection(CONFIGS_COLLECTION).doc(configId);
      const existing = await docRef.get();
      if (!existing.exists) throw new Error('Config not found');
      await docRef.delete();
    },

    // ---- Scores / votes ----

    async listScoresByEntry(contestId, entryId): Promise<ScoreEntry[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(VOTES_SUBCOLLECTION)
        .where('entryId', '==', entryId)
        .get();
      return snapshot.docs.map((d) => docToScoreEntry(d.id, d.data() as Record<string, unknown>));
    },

    async listScoresByUser(contestId, userId): Promise<ScoreEntry[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(VOTES_SUBCOLLECTION)
        .where('userId', '==', userId)
        .get();
      return snapshot.docs.map((d) => docToScoreEntry(d.id, d.data() as Record<string, unknown>));
    },

    async getScore(contestId, scoreId): Promise<ScoreEntry | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(VOTES_SUBCOLLECTION)
        .doc(scoreId)
        .get();
      if (!snap.exists) return null;
      return docToScoreEntry(snap.id, snap.data() as Record<string, unknown>);
    },

    async submitScore(contestId, input): Promise<ScoreEntry> {
      const db = requireDb();
      const { userId, entryId, matchupId } = input;
      if (!matchupId) throw new Error('matchupId is required');
      const voteDocId = makeVoteDocId(userId, matchupId, entryId);

      return db.runTransaction(async (transaction) => {
        const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
        const matchupRef = contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(matchupId);
        const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(voteDocId);

        const [matchupSnap, voteSnap] = await Promise.all([
          transaction.get(matchupRef),
          transaction.get(voteRef),
        ]);

        if (!matchupSnap.exists) throw new Error('Matchup not found');

        const matchupData = matchupSnap.data() as Record<string, unknown>;
        if (matchupData.phase !== 'shake') throw new Error('Matchup is not open for scoring');
        const entries = ((matchupData.entries as Entry[] | undefined) ?? []).map((e) => ({ ...e }));
        const entryIndex = entries.findIndex((e) => e.id === entryId);
        if (entryIndex === -1) throw new Error('Entry is not part of this matchup');

        const newTotal = computeVoteTotal(input.breakdown);
        let delta: number;
        let isNewVote: boolean;

        if (voteSnap.exists) {
          const oldBreakdown = ((voteSnap.data() as Record<string, unknown>).breakdown ?? {}) as ScoreBreakdown;
          delta = newTotal - computeVoteTotal(oldBreakdown);
          isNewVote = false;
        } else {
          delta = newTotal;
          isNewVote = true;
        }

        const voteData: Record<string, unknown> = {
          userId,
          entryId,
          matchupId,
          breakdown: input.breakdown,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (isNewVote) voteData.createdAt = FieldValue.serverTimestamp();
        transaction.set(voteRef, voteData, { merge: true });

        const entry = entries[entryIndex];
        entry.sumScore = (entry.sumScore ?? 0) + delta;
        entry.voteCount = (entry.voteCount ?? 0) + (isNewVote ? 1 : 0);

        transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });

        return docToScoreEntry(voteDocId, {
          userId,
          entryId,
          matchupId,
          breakdown: input.breakdown,
        });
      });
    },

    async updateScore(contestId, scoreId, updates): Promise<ScoreEntry> {
      const db = requireDb();

      return db.runTransaction(async (transaction) => {
        const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
        const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(scoreId);

        const voteSnap = await transaction.get(voteRef);
        if (!voteSnap.exists) throw new Error('Vote not found');

        const existingData = voteSnap.data() as Record<string, unknown>;
        const entryId = existingData.entryId as string;
        const matchupId = existingData.matchupId as string | undefined;

        const oldBreakdown = (existingData.breakdown ?? {}) as ScoreBreakdown;
        const newBreakdown: ScoreBreakdown = { ...oldBreakdown };
        if (updates.breakdown) {
          for (const [key, value] of Object.entries(updates.breakdown)) {
            if (typeof value === 'number') newBreakdown[key] = value;
          }
        }

        const delta = computeVoteTotal(newBreakdown) - computeVoteTotal(oldBreakdown);

        const voteUpdate: Record<string, unknown> = {
          breakdown: newBreakdown,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (updates.notes !== undefined) voteUpdate.notes = updates.notes;
        transaction.set(voteRef, voteUpdate, { merge: true });

        if (matchupId) {
          const matchupRef = contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(matchupId);
          const matchupSnap = await transaction.get(matchupRef);
          if (matchupSnap.exists) {
            const entries = (((matchupSnap.data() as Record<string, unknown>).entries as Entry[] | undefined) ?? [])
              .map((e) => ({ ...e })) as Entry[];
            const entryIndex = entries.findIndex((e) => e.id === entryId);
            if (entryIndex !== -1) {
              entries[entryIndex].sumScore = (entries[entryIndex].sumScore ?? 0) + delta;
              transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });
            }
          }
        }

        return docToScoreEntry(scoreId, {
          ...existingData,
          breakdown: newBreakdown,
          ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        });
      });
    },

    async deleteScore(contestId, scoreId): Promise<void> {
      const db = requireDb();

      await db.runTransaction(async (transaction) => {
        const contestRef = db.collection(CONTESTS_COLLECTION).doc(contestId);
        const voteRef = contestRef.collection(VOTES_SUBCOLLECTION).doc(scoreId);

        const voteSnap = await transaction.get(voteRef);
        if (!voteSnap.exists) throw new Error('Vote not found');

        const voteData = voteSnap.data() as Record<string, unknown>;
        const entryId = voteData.entryId as string;
        const matchupId = voteData.matchupId as string | undefined;
        const oldBreakdown = (voteData.breakdown ?? {}) as ScoreBreakdown;
        const oldTotal = computeVoteTotal(oldBreakdown);

        if (matchupId) {
          const matchupRef = contestRef.collection(MATCHUPS_SUBCOLLECTION).doc(matchupId);
          const matchupSnap = await transaction.get(matchupRef);
          if (matchupSnap.exists) {
            const entries = (((matchupSnap.data() as Record<string, unknown>).entries as Entry[] | undefined) ?? [])
              .map((e) => ({ ...e })) as Entry[];
            const entryIndex = entries.findIndex((e) => e.id === entryId);
            if (entryIndex !== -1) {
              entries[entryIndex].sumScore = (entries[entryIndex].sumScore ?? 0) - oldTotal;
              entries[entryIndex].voteCount = Math.max(0, (entries[entryIndex].voteCount ?? 0) - 1);
              transaction.update(matchupRef, { entries, updatedAt: FieldValue.serverTimestamp() });
            }
          }
        }

        transaction.delete(voteRef);
      });
    },

    // ---- Matchups ----

    async listMatchups(contestId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .get();
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data() as Record<string, unknown>));
    },

    async listMatchupsByRound(contestId, roundId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .where('roundId', '==', roundId)
        .get();
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data() as Record<string, unknown>));
    },

    async getMatchup(contestId, matchupId): Promise<Matchup | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(matchupId)
        .get();
      if (!snap.exists) return null;
      return normalizeMatchupDoc(contestId, snap.id, snap.data() as Record<string, unknown>);
    },

    async createMatchup(contestId, input: MatchupCreateInput): Promise<Matchup> {
      const db = requireDb();
      const id = input.id ?? generateId('matchup');
      const { id: _ignored, contestantIds, entries: providedEntries, ...rest } = input;
      void _ignored;

      const entries = providedEntries
        ?? (contestantIds ? buildInlineEntriesFromContestantIds(id, contestantIds) : []);

      await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(id)
        .set({
          ...rest,
          entries,
          contestId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

      return { ...rest, entries, id, contestId } as Matchup;
    },

    async updateMatchup(contestId, matchupId, updates): Promise<Matchup> {
      const db = requireDb();
      const ref = db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(matchupId);

      const { id: _ignoredId, contestId: _ignoredContestId, ...rest } = updates;
      void _ignoredId;
      void _ignoredContestId;

      await ref.update({ ...rest, updatedAt: FieldValue.serverTimestamp() });
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Matchup not found');
      return normalizeMatchupDoc(contestId, snap.id, snap.data() as Record<string, unknown>);
    },

    async deleteMatchup(contestId, matchupId): Promise<void> {
      const db = requireDb();
      await db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(matchupId)
        .delete();
    },

    async batchCreateMatchups(contestId, inputs: MatchupCreateInput[]): Promise<Matchup[]> {
      const db = requireDb();
      const batch = db.batch();
      const created: Matchup[] = [];

      for (const input of inputs) {
        const id = input.id ?? generateId('matchup');
        const { id: _ignored, contestantIds, entries: providedEntries, ...rest } = input;
        void _ignored;
        const entries = providedEntries
          ?? (contestantIds ? buildInlineEntriesFromContestantIds(id, contestantIds) : []);
        const ref = db
          .collection(CONTESTS_COLLECTION)
          .doc(contestId)
          .collection(MATCHUPS_SUBCOLLECTION)
          .doc(id);
        batch.set(ref, {
          ...rest,
          entries,
          contestId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        created.push({ ...rest, entries, id, contestId } as Matchup);
      }

      await batch.commit();
      return created;
    },

    async setMatchupEntryName(contestId, matchupId, entryId, payload): Promise<Matchup> {
      const db = requireDb();
      const ref = db
        .collection(CONTESTS_COLLECTION)
        .doc(contestId)
        .collection(MATCHUPS_SUBCOLLECTION)
        .doc(matchupId);

      return db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new Error('Matchup not found');
        const data = snap.data() as Record<string, unknown>;
        const entries = ((data.entries as Entry[] | undefined) ?? []).map((e) => ({ ...e }));
        const idx = entries.findIndex((e) => e.id === entryId);
        if (idx === -1) throw new Error('Entry not found on matchup');
        entries[idx].name = payload.name;
        if (payload.description !== undefined) {
          entries[idx].description = payload.description;
        }
        transaction.update(ref, { entries, updatedAt: FieldValue.serverTimestamp() });
        return normalizeMatchupDoc(contestId, matchupId, { ...data, entries });
      });
    },

    // ---- User profiles ----

    async getProfile(uid): Promise<UserProfile | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
      if (!snap.exists) return null;
      return snap.data() as UserProfile;
    },

    async upsertProfile(uid, profile): Promise<UserProfile> {
      const db = requireDb();
      const ref = db.collection(USERS_COLLECTION).doc(uid);
      const existing = await ref.get();
      if (existing.exists) {
        await ref.update({ ...profile, updatedAt: FieldValue.serverTimestamp() });
      } else {
        await ref.set({
          ...profile,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      const snap = await ref.get();
      return snap.data() as UserProfile;
    },

    async updateProfile(uid, updates): Promise<UserProfile> {
      const db = requireDb();
      const ref = db.collection(USERS_COLLECTION).doc(uid);
      await ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Profile not found');
      return snap.data() as UserProfile;
    },
  };
}
