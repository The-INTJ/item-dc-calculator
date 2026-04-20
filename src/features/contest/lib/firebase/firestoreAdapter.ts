/**
 * Firestore adapter — SDK-agnostic interface for all Firestore operations.
 *
 * Two implementations exist:
 *  - this file (client SDK, used in the browser for realtime-compatible flows)
 *  - firestoreAdminAdapter.ts (Admin SDK, used in API routes on the server)
 *
 * Sub-providers must only call adapter methods — never import `firebase/firestore`
 * or `firebase-admin/firestore` directly. This keeps the server/client swap in
 * firebaseBackendProvider.ts as the single branch point.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import type { Contest, ContestConfigItem, Entry, Matchup, ScoreBreakdown, ScoreEntry, Voter } from '../../contexts/contest/contestTypes';
import type { MatchupCreateInput, ScoreUpdatePayload, UserProfile } from '../backend/types';
import { generateId } from '../backend/providerUtils';
import { computeVoteTotal, docToScoreEntry, makeVoteDocId } from './scoreHelpers';

const CONTESTS_COLLECTION = 'contests';
const CONFIGS_COLLECTION = 'configs';
const USERS_COLLECTION = 'users';
const VOTES_SUBCOLLECTION = 'votes';
const MATCHUPS_SUBCOLLECTION = 'matchups';

function normalizeContestDoc(id: string, data: Record<string, unknown>): Contest {
  // Strip Firestore Timestamps — they're class instances that break RSC
  // serialization when contests are passed from server components to
  // client components, and the Contest type doesn't expose them anyway.
  const { createdAt: _c, updatedAt: _u, ...rest } = data;
  return {
    ...rest,
    id,
    voters: (rest.voters ?? rest.judges ?? []) as Voter[],
  } as Contest;
}

function normalizeMatchupDoc(contestId: string, id: string, data: Record<string, unknown>): Matchup {
  const { createdAt: _c, updatedAt: _u, ...rest } = data;
  return {
    ...rest,
    id,
    contestId,
  } as Matchup;
}

/**
 * SDK-agnostic adapter interface for contest/config/score operations.
 */
export interface FirestoreAdapter {
  /** True iff the underlying database connection is initialized. */
  isReady(): boolean;

  // ---- Contests ----
  getContest(contestId: string): Promise<Contest | null>;
  getContestBySlug(slug: string): Promise<Contest | null>;
  getDefaultContest(): Promise<Contest | null>;
  listContests(): Promise<Contest[]>;
  createContest(id: string, data: Omit<Contest, 'id'>): Promise<void>;
  updateContest(contestId: string, updates: Partial<Contest>): Promise<void>;
  deleteContest(contestId: string): Promise<void>;

  // ---- Configs ----
  getConfig(configId: string): Promise<ContestConfigItem | null>;
  listConfigs(): Promise<ContestConfigItem[]>;
  configExists(configId: string): Promise<boolean>;
  createConfig(id: string, data: Omit<ContestConfigItem, 'id'>): Promise<void>;
  updateConfig(configId: string, updates: Partial<ContestConfigItem>): Promise<ContestConfigItem>;
  deleteConfig(configId: string): Promise<void>;

  // ---- Scores / votes ----
  listScoresByEntry(contestId: string, entryId: string): Promise<ScoreEntry[]>;
  listScoresByUser(contestId: string, userId: string): Promise<ScoreEntry[]>;
  getScore(contestId: string, scoreId: string): Promise<ScoreEntry | null>;
  submitScore(contestId: string, input: Omit<ScoreEntry, 'id'>): Promise<ScoreEntry>;
  updateScore(contestId: string, scoreId: string, updates: ScoreUpdatePayload): Promise<ScoreEntry>;
  deleteScore(contestId: string, scoreId: string): Promise<void>;

  // ---- Matchups ----
  listMatchups(contestId: string): Promise<Matchup[]>;
  listMatchupsByRound(contestId: string, roundId: string): Promise<Matchup[]>;
  getMatchup(contestId: string, matchupId: string): Promise<Matchup | null>;
  createMatchup(contestId: string, matchup: MatchupCreateInput): Promise<Matchup>;
  updateMatchup(contestId: string, matchupId: string, updates: Partial<Matchup>): Promise<Matchup>;
  deleteMatchup(contestId: string, matchupId: string): Promise<void>;
  batchCreateMatchups(contestId: string, matchups: MatchupCreateInput[]): Promise<Matchup[]>;

  // ---- User profiles ----
  getProfile(uid: string): Promise<UserProfile | null>;
  upsertProfile(uid: string, profile: UserProfile): Promise<UserProfile>;
  updateProfile(uid: string, updates: Partial<UserProfile>): Promise<UserProfile>;
}

/**
 * Creates a Firestore adapter backed by the client SDK.
 */
export function createFirestoreAdapter(getDb: () => Firestore | null): FirestoreAdapter {
  function requireDb(): Firestore {
    const db = getDb();
    if (!db) throw new Error('Firebase not initialized');
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

      const docSnap = await getDoc(doc(db, CONTESTS_COLLECTION, contestId));
      if (!docSnap.exists()) return null;

      return normalizeContestDoc(docSnap.id, docSnap.data());
    },

    async getContestBySlug(slug): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const q = query(collection(db, CONTESTS_COLLECTION), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return normalizeContestDoc(docSnap.id, docSnap.data());
    },

    async getDefaultContest(): Promise<Contest | null> {
      const db = getDb();
      if (!db) return null;

      const q = query(collection(db, CONTESTS_COLLECTION), where('defaultContest', '==', true));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return normalizeContestDoc(docSnap.id, docSnap.data());
    },

    async listContests(): Promise<Contest[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await getDocs(collection(db, CONTESTS_COLLECTION));
      return snapshot.docs.map((docSnap) => normalizeContestDoc(docSnap.id, docSnap.data()));
    },

    async createContest(id, data): Promise<void> {
      const db = requireDb();
      await setDoc(doc(db, CONTESTS_COLLECTION, id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    async updateContest(contestId, updates): Promise<void> {
      const db = requireDb();
      await updateDoc(doc(db, CONTESTS_COLLECTION, contestId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },

    async deleteContest(contestId): Promise<void> {
      const db = requireDb();
      await deleteDoc(doc(db, CONTESTS_COLLECTION, contestId));
    },

    // ---- Configs ----

    async getConfig(configId): Promise<ContestConfigItem | null> {
      const db = getDb();
      if (!db) return null;

      const docSnap = await getDoc(doc(db, CONFIGS_COLLECTION, configId));
      if (!docSnap.exists()) return null;

      return { id: docSnap.id, ...docSnap.data() } as ContestConfigItem;
    },

    async listConfigs(): Promise<ContestConfigItem[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await getDocs(collection(db, CONFIGS_COLLECTION));
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ContestConfigItem[];
    },

    async configExists(configId): Promise<boolean> {
      const db = getDb();
      if (!db) return false;

      const snap = await getDoc(doc(db, CONFIGS_COLLECTION, configId));
      return snap.exists();
    },

    async createConfig(id, data): Promise<void> {
      const db = requireDb();
      await setDoc(doc(db, CONFIGS_COLLECTION, id), data);
    },

    async updateConfig(configId, updates): Promise<ContestConfigItem> {
      const db = requireDb();
      const docRef = doc(db, CONFIGS_COLLECTION, configId);
      const existing = await getDoc(docRef);
      if (!existing.exists()) throw new Error('Config not found');

      const { id: _ignored, ...updateData } = updates;
      void _ignored;
      await updateDoc(docRef, updateData);

      const updated = await getDoc(docRef);
      return { id: updated.id, ...updated.data() } as ContestConfigItem;
    },

    async deleteConfig(configId): Promise<void> {
      const db = requireDb();
      const docRef = doc(db, CONFIGS_COLLECTION, configId);
      const existing = await getDoc(docRef);
      if (!existing.exists()) throw new Error('Config not found');
      await deleteDoc(docRef);
    },

    // ---- Scores / votes ----

    async listScoresByEntry(contestId, entryId): Promise<ScoreEntry[]> {
      const db = getDb();
      if (!db) return [];

      const q = query(
        collection(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION),
        where('entryId', '==', entryId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToScoreEntry(d.id, d.data()));
    },

    async listScoresByUser(contestId, userId): Promise<ScoreEntry[]> {
      const db = getDb();
      if (!db) return [];

      const q = query(
        collection(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION),
        where('userId', '==', userId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToScoreEntry(d.id, d.data()));
    },

    async getScore(contestId, scoreId): Promise<ScoreEntry | null> {
      const db = getDb();
      if (!db) return null;

      const docRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return docToScoreEntry(docSnap.id, docSnap.data());
    },

    async submitScore(contestId, input): Promise<ScoreEntry> {
      const db = requireDb();
      const { userId, entryId, matchupId } = input;
      if (!matchupId) throw new Error('matchupId is required');
      const voteDocId = makeVoteDocId(userId, matchupId, entryId);

      return runTransaction(db, async (transaction) => {
        const contestRef = doc(db, CONTESTS_COLLECTION, contestId);
        const matchupRef = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId);
        const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, voteDocId);

        const [contestSnap, matchupSnap, voteSnap] = await Promise.all([
          transaction.get(contestRef),
          transaction.get(matchupRef),
          transaction.get(voteRef),
        ]);

        if (!contestSnap.exists()) throw new Error('Contest not found');
        if (!matchupSnap.exists()) throw new Error('Matchup not found');

        const matchupData = matchupSnap.data() as Record<string, unknown>;
        if (matchupData.phase !== 'shake') throw new Error('Matchup is not open for scoring');
        const matchupEntryIds = (matchupData.entryIds as string[] | undefined) ?? [];
        if (!matchupEntryIds.includes(entryId)) throw new Error('Entry is not part of this matchup');

        const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
        const entryIndex = contest.entries?.findIndex((e: Entry) => e.id === entryId);
        if (entryIndex === undefined || entryIndex === -1) throw new Error('Entry not found');

        const newTotal = computeVoteTotal(input.breakdown);
        let delta: number;
        let isNewVote: boolean;

        if (voteSnap.exists()) {
          const oldBreakdown = (voteSnap.data().breakdown ?? {}) as ScoreBreakdown;
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
          updatedAt: serverTimestamp(),
        };
        if (isNewVote) voteData.createdAt = serverTimestamp();
        transaction.set(voteRef, voteData, { merge: true });

        const entries = [...contest.entries];
        const entry = { ...entries[entryIndex] };
        entry.sumScore = (entry.sumScore ?? 0) + delta;
        entry.voteCount = (entry.voteCount ?? 0) + (isNewVote ? 1 : 0);
        entries[entryIndex] = entry;

        transaction.update(contestRef, { entries, updatedAt: serverTimestamp() });

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

      return runTransaction(db, async (transaction) => {
        const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);
        const contestRef = doc(db, CONTESTS_COLLECTION, contestId);

        const [voteSnap, contestSnap] = await Promise.all([
          transaction.get(voteRef),
          transaction.get(contestRef),
        ]);

        if (!voteSnap.exists()) throw new Error('Vote not found');
        if (!contestSnap.exists()) throw new Error('Contest not found');

        const existingData = voteSnap.data();
        const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
        const entryId = existingData.entryId as string;

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
          updatedAt: serverTimestamp(),
        };
        if (updates.notes !== undefined) voteUpdate.notes = updates.notes;
        transaction.set(voteRef, voteUpdate, { merge: true });

        const entryIndex = contest.entries?.findIndex((e: Entry) => e.id === entryId);
        if (entryIndex !== undefined && entryIndex !== -1) {
          const entries = [...contest.entries];
          const entry = { ...entries[entryIndex] };
          entry.sumScore = (entry.sumScore ?? 0) + delta;
          entries[entryIndex] = entry;
          transaction.update(contestRef, { entries, updatedAt: serverTimestamp() });
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

      await runTransaction(db, async (transaction) => {
        const voteRef = doc(db, CONTESTS_COLLECTION, contestId, VOTES_SUBCOLLECTION, scoreId);
        const contestRef = doc(db, CONTESTS_COLLECTION, contestId);

        const [voteSnap, contestSnap] = await Promise.all([
          transaction.get(voteRef),
          transaction.get(contestRef),
        ]);

        if (!voteSnap.exists()) throw new Error('Vote not found');
        if (!contestSnap.exists()) throw new Error('Contest not found');

        const voteData = voteSnap.data();
        const entryId = voteData.entryId as string;
        const oldBreakdown = (voteData.breakdown ?? {}) as ScoreBreakdown;
        const oldTotal = computeVoteTotal(oldBreakdown);

        const contest = { id: contestSnap.id, ...contestSnap.data() } as Contest;
        const entryIndex = contest.entries?.findIndex((e: Entry) => e.id === entryId);

        if (entryIndex !== undefined && entryIndex !== -1) {
          const entries = [...contest.entries];
          const entry = { ...entries[entryIndex] };
          entry.sumScore = (entry.sumScore ?? 0) - oldTotal;
          entry.voteCount = Math.max(0, (entry.voteCount ?? 0) - 1);
          entries[entryIndex] = entry;
          transaction.update(contestRef, { entries, updatedAt: serverTimestamp() });
        }

        transaction.delete(voteRef);
      });
    },

    // ---- Matchups ----

    async listMatchups(contestId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const snapshot = await getDocs(
        collection(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION),
      );
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data()));
    },

    async listMatchupsByRound(contestId, roundId): Promise<Matchup[]> {
      const db = getDb();
      if (!db) return [];

      const q = query(
        collection(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION),
        where('roundId', '==', roundId),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => normalizeMatchupDoc(contestId, d.id, d.data()));
    },

    async getMatchup(contestId, matchupId): Promise<Matchup | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await getDoc(doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId));
      if (!snap.exists()) return null;
      return normalizeMatchupDoc(contestId, snap.id, snap.data());
    },

    async createMatchup(contestId, input): Promise<Matchup> {
      const db = requireDb();
      const id = input.id ?? generateId('matchup');
      const { id: _ignored, ...rest } = input;
      void _ignored;

      const ref = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, id);
      await setDoc(ref, {
        ...rest,
        contestId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { ...rest, id, contestId } as Matchup;
    },

    async updateMatchup(contestId, matchupId, updates): Promise<Matchup> {
      const db = requireDb();
      const ref = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId);

      const { id: _ignoredId, contestId: _ignoredContestId, ...rest } = updates;
      void _ignoredId;
      void _ignoredContestId;

      await updateDoc(ref, { ...rest, updatedAt: serverTimestamp() });
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Matchup not found');
      return normalizeMatchupDoc(contestId, snap.id, snap.data());
    },

    async deleteMatchup(contestId, matchupId): Promise<void> {
      const db = requireDb();
      await deleteDoc(doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, matchupId));
    },

    async batchCreateMatchups(contestId, inputs): Promise<Matchup[]> {
      const db = requireDb();
      const batch = writeBatch(db);
      const created: Matchup[] = [];

      for (const input of inputs) {
        const id = input.id ?? generateId('matchup');
        const { id: _ignored, ...rest } = input;
        void _ignored;
        const ref = doc(db, CONTESTS_COLLECTION, contestId, MATCHUPS_SUBCOLLECTION, id);
        batch.set(ref, {
          ...rest,
          contestId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        created.push({ ...rest, id, contestId } as Matchup);
      }

      await batch.commit();
      return created;
    },

    // ---- User profiles ----

    async getProfile(uid): Promise<UserProfile | null> {
      const db = getDb();
      if (!db) return null;

      const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    },

    async upsertProfile(uid, profile): Promise<UserProfile> {
      const db = requireDb();
      const ref = doc(db, USERS_COLLECTION, uid);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        await updateDoc(ref, { ...profile, updatedAt: serverTimestamp() });
      } else {
        await setDoc(ref, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      const snap = await getDoc(ref);
      return snap.data() as UserProfile;
    },

    async updateProfile(uid, updates): Promise<UserProfile> {
      const db = requireDb();
      await updateDoc(doc(db, USERS_COLLECTION, uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (!snap.exists()) throw new Error('Profile not found');
      return snap.data() as UserProfile;
    },
  };
}
