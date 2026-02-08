/**
 * In-memory implementation of BackendProvider for testing.
 * All data is stored in memory and reset between test runs.
 */

import type {
  BackendProvider,
  ContestsProvider,
  EntriesProvider,
  JudgesProvider,
  ScoresProvider,
  ConfigsProvider,
  ProviderResult,
  Contest,
  Entry,
  Judge,
  ScoreEntry,
  ContestConfigItem,
  ScoreUpdatePayload,
  ScoreBreakdown,
} from '../helpers/types';

// In-memory data stores
interface DataStore {
  contests: Map<string, Contest>;
  entries: Map<string, Map<string, Entry>>; // contestId -> entryId -> Entry
  judges: Map<string, Map<string, Judge>>; // contestId -> judgeId -> Judge
  scores: Map<string, Map<string, ScoreEntry>>; // contestId -> scoreId -> ScoreEntry
  configs: Map<string, ContestConfigItem>;
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createDataStore(): DataStore {
  return {
    contests: new Map(),
    entries: new Map(),
    judges: new Map(),
    scores: new Map(),
    configs: new Map(),
  };
}

class InMemoryContestsProvider implements ContestsProvider {
  constructor(private store: DataStore) {}

  async list(): Promise<ProviderResult<Contest[]>> {
    return { success: true, data: Array.from(this.store.contests.values()) };
  }

  async getBySlug(slug: string): Promise<ProviderResult<Contest | null>> {
    const contest = Array.from(this.store.contests.values()).find(
      (c) => c.slug === slug
    );
    if (!contest) {
      // Also check by ID
      const byId = this.store.contests.get(slug);
      if (byId) return { success: true, data: byId };
      return { success: false, error: 'Contest not found' };
    }
    return { success: true, data: contest };
  }

  async getDefault(): Promise<ProviderResult<Contest | null>> {
    const contest = Array.from(this.store.contests.values()).find(
      (c) => c.defaultContest
    );
    return { success: true, data: contest ?? null };
  }

  async create(
    contest: Omit<Contest, 'id' | 'entries' | 'judges' | 'scores'>
  ): Promise<ProviderResult<Contest>> {
    const id = generateId('contest');
    const newContest: Contest = {
      ...contest,
      id,
      phase: contest.phase ?? 'set',
      entries: [],
      judges: [],
      scores: [],
    };
    this.store.contests.set(id, newContest);
    this.store.entries.set(id, new Map());
    this.store.judges.set(id, new Map());
    this.store.scores.set(id, new Map());
    return { success: true, data: newContest };
  }

  async update(
    id: string,
    updates: Partial<Contest>
  ): Promise<ProviderResult<Contest>> {
    const contest = this.store.contests.get(id);
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }
    const updated = { ...contest, ...updates };
    this.store.contests.set(id, updated);
    return { success: true, data: updated };
  }

  async delete(id: string): Promise<ProviderResult<void>> {
    if (!this.store.contests.has(id)) {
      return { success: false, error: 'Contest not found' };
    }
    this.store.contests.delete(id);
    this.store.entries.delete(id);
    this.store.judges.delete(id);
    this.store.scores.delete(id);
    return { success: true };
  }

  async setDefault(id: string): Promise<ProviderResult<Contest>> {
    const contest = this.store.contests.get(id);
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }
    // Clear other defaults
    for (const [cid, c] of this.store.contests) {
      if (c.defaultContest) {
        this.store.contests.set(cid, { ...c, defaultContest: false });
      }
    }
    const updated = { ...contest, defaultContest: true };
    this.store.contests.set(id, updated);
    return { success: true, data: updated };
  }
}

class InMemoryEntriesProvider implements EntriesProvider {
  constructor(private store: DataStore) {}

  private getContestEntries(contestId: string): Map<string, Entry> | null {
    // Try by ID first
    let entries = this.store.entries.get(contestId);
    if (entries) return entries;

    // Try by slug
    const contest = Array.from(this.store.contests.values()).find(
      (c) => c.slug === contestId
    );
    if (contest) {
      return this.store.entries.get(contest.id) ?? null;
    }
    return null;
  }

  private getContestId(contestIdOrSlug: string): string | null {
    if (this.store.contests.has(contestIdOrSlug)) return contestIdOrSlug;
    const contest = Array.from(this.store.contests.values()).find(
      (c) => c.slug === contestIdOrSlug
    );
    return contest?.id ?? null;
  }

  private syncEntriesToContest(contestId: string): void {
    const entries = this.store.entries.get(contestId);
    const contest = this.store.contests.get(contestId);
    if (entries && contest) {
      contest.entries = Array.from(entries.values());
      this.store.contests.set(contestId, contest);
    }
  }

  async listByContest(contestId: string): Promise<ProviderResult<Entry[]>> {
    const entries = this.getContestEntries(contestId);
    if (!entries) {
      return { success: false, error: 'Contest not found' };
    }
    return { success: true, data: Array.from(entries.values()) };
  }

  async getById(
    contestId: string,
    entryId: string
  ): Promise<ProviderResult<Entry | null>> {
    const entries = this.getContestEntries(contestId);
    if (!entries) {
      return { success: false, error: 'Contest not found' };
    }
    const entry =
      entries.get(entryId) ??
      Array.from(entries.values()).find((e) => e.slug === entryId);
    if (!entry) {
      return { success: false, error: 'Entry not found' };
    }
    return { success: true, data: entry };
  }

  async create(
    contestId: string,
    entry: Omit<Entry, 'id'>
  ): Promise<ProviderResult<Entry>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const entries = this.store.entries.get(realContestId)!;
    const id = generateId('entry');
    const newEntry: Entry = { ...entry, id };
    entries.set(id, newEntry);
    this.syncEntriesToContest(realContestId);
    return { success: true, data: newEntry };
  }

  async update(
    contestId: string,
    entryId: string,
    updates: Partial<Entry>
  ): Promise<ProviderResult<Entry>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const entries = this.store.entries.get(realContestId);
    if (!entries) {
      return { success: false, error: 'Contest not found' };
    }
    const entry =
      entries.get(entryId) ??
      Array.from(entries.values()).find((e) => e.slug === entryId);
    if (!entry) {
      return { success: false, error: 'Entry not found' };
    }
    const updated = { ...entry, ...updates };
    entries.set(entry.id, updated);
    this.syncEntriesToContest(realContestId);
    return { success: true, data: updated };
  }

  async delete(
    contestId: string,
    entryId: string
  ): Promise<ProviderResult<void>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const entries = this.store.entries.get(realContestId);
    if (!entries) {
      return { success: false, error: 'Contest not found' };
    }
    const entry =
      entries.get(entryId) ??
      Array.from(entries.values()).find((e) => e.slug === entryId);
    if (!entry) {
      return { success: false, error: 'Entry not found' };
    }
    entries.delete(entry.id);
    this.syncEntriesToContest(realContestId);
    return { success: true };
  }
}

class InMemoryJudgesProvider implements JudgesProvider {
  constructor(private store: DataStore) {}

  private getContestJudges(contestId: string): Map<string, Judge> | null {
    let judges = this.store.judges.get(contestId);
    if (judges) return judges;
    const contest = Array.from(this.store.contests.values()).find(
      (c) => c.slug === contestId
    );
    if (contest) {
      return this.store.judges.get(contest.id) ?? null;
    }
    return null;
  }

  private getContestId(contestIdOrSlug: string): string | null {
    if (this.store.contests.has(contestIdOrSlug)) return contestIdOrSlug;
    const contest = Array.from(this.store.contests.values()).find(
      (c) => c.slug === contestIdOrSlug
    );
    return contest?.id ?? null;
  }

  private syncJudgesToContest(contestId: string): void {
    const judges = this.store.judges.get(contestId);
    const contest = this.store.contests.get(contestId);
    if (judges && contest) {
      contest.judges = Array.from(judges.values());
      this.store.contests.set(contestId, contest);
    }
  }

  async listByContest(contestId: string): Promise<ProviderResult<Judge[]>> {
    const judges = this.getContestJudges(contestId);
    if (!judges) {
      return { success: false, error: 'Contest not found' };
    }
    return { success: true, data: Array.from(judges.values()) };
  }

  async getById(
    contestId: string,
    judgeId: string
  ): Promise<ProviderResult<Judge | null>> {
    const judges = this.getContestJudges(contestId);
    if (!judges) {
      return { success: false, error: 'Contest not found' };
    }
    const judge = judges.get(judgeId);
    if (!judge) {
      return { success: false, error: 'Judge not found' };
    }
    return { success: true, data: judge };
  }

  async create(
    contestId: string,
    judge: Omit<Judge, 'id'> & { id?: string }
  ): Promise<ProviderResult<Judge>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const judges = this.store.judges.get(realContestId)!;
    const id = judge.id ?? generateId('judge');
    const newJudge: Judge = { ...judge, id };
    judges.set(id, newJudge);
    this.syncJudgesToContest(realContestId);
    return { success: true, data: newJudge };
  }

  async update(
    contestId: string,
    judgeId: string,
    updates: Partial<Judge>
  ): Promise<ProviderResult<Judge>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const judges = this.store.judges.get(realContestId);
    if (!judges) {
      return { success: false, error: 'Contest not found' };
    }
    const judge = judges.get(judgeId);
    if (!judge) {
      return { success: false, error: 'Judge not found' };
    }
    const updated = { ...judge, ...updates };
    judges.set(judgeId, updated);
    this.syncJudgesToContest(realContestId);
    return { success: true, data: updated };
  }

  async delete(
    contestId: string,
    judgeId: string
  ): Promise<ProviderResult<void>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const judges = this.store.judges.get(realContestId);
    if (!judges) {
      return { success: false, error: 'Contest not found' };
    }
    if (!judges.has(judgeId)) {
      return { success: false, error: 'Judge not found' };
    }
    judges.delete(judgeId);
    this.syncJudgesToContest(realContestId);
    return { success: true };
  }
}

class InMemoryScoresProvider implements ScoresProvider {
  constructor(private store: DataStore) {}

  private getContestScores(contestId: string): Map<string, ScoreEntry> | null {
    let scores = this.store.scores.get(contestId);
    if (scores) return scores;
    const contest = Array.from(this.store.contests.values()).find(
      (c) => c.slug === contestId
    );
    if (contest) {
      return this.store.scores.get(contest.id) ?? null;
    }
    return null;
  }

  private getContestId(contestIdOrSlug: string): string | null {
    if (this.store.contests.has(contestIdOrSlug)) return contestIdOrSlug;
    const contest = Array.from(this.store.contests.values()).find(
      (c) => c.slug === contestIdOrSlug
    );
    return contest?.id ?? null;
  }

  private syncScoresToContest(contestId: string): void {
    const scores = this.store.scores.get(contestId);
    const contest = this.store.contests.get(contestId);
    if (scores && contest) {
      contest.scores = Array.from(scores.values());
      this.store.contests.set(contestId, contest);
    }
  }

  async listByEntry(
    contestId: string,
    entryId: string
  ): Promise<ProviderResult<ScoreEntry[]>> {
    const scores = this.getContestScores(contestId);
    if (!scores) {
      return { success: false, error: 'Contest not found' };
    }
    const filtered = Array.from(scores.values()).filter(
      (s) => s.entryId === entryId
    );
    return { success: true, data: filtered };
  }

  async listByJudge(
    contestId: string,
    judgeId: string
  ): Promise<ProviderResult<ScoreEntry[]>> {
    const scores = this.getContestScores(contestId);
    if (!scores) {
      return { success: false, error: 'Contest not found' };
    }
    const filtered = Array.from(scores.values()).filter(
      (s) => s.judgeId === judgeId
    );
    return { success: true, data: filtered };
  }

  async getById(
    contestId: string,
    scoreId: string
  ): Promise<ProviderResult<ScoreEntry | null>> {
    const scores = this.getContestScores(contestId);
    if (!scores) {
      return { success: false, error: 'Contest not found' };
    }
    const score = scores.get(scoreId);
    if (!score) {
      return { success: false, error: 'Score not found' };
    }
    return { success: true, data: score };
  }

  async submit(
    contestId: string,
    score: Omit<ScoreEntry, 'id'>
  ): Promise<ProviderResult<ScoreEntry>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const scores = this.store.scores.get(realContestId)!;

    // Check for existing score by same judge for same entry
    const existing = Array.from(scores.values()).find(
      (s) => s.judgeId === score.judgeId && s.entryId === score.entryId
    );

    if (existing) {
      // Update existing score
      const updated: ScoreEntry = {
        ...existing,
        breakdown: { ...existing.breakdown, ...score.breakdown },
        notes: score.notes ?? existing.notes,
        naSections: score.naSections ?? existing.naSections,
      };
      scores.set(existing.id, updated);
      this.syncScoresToContest(realContestId);
      return { success: true, data: updated };
    }

    const id = generateId('score');
    const newScore: ScoreEntry = { ...score, id };
    scores.set(id, newScore);
    this.syncScoresToContest(realContestId);
    return { success: true, data: newScore };
  }

  async update(
    contestId: string,
    scoreId: string,
    updates: ScoreUpdatePayload
  ): Promise<ProviderResult<ScoreEntry>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const scores = this.store.scores.get(realContestId);
    if (!scores) {
      return { success: false, error: 'Contest not found' };
    }
    const score = scores.get(scoreId);
    if (!score) {
      return { success: false, error: 'Score not found' };
    }
    const updated: ScoreEntry = {
      ...score,
      breakdown: { ...score.breakdown, ...updates.breakdown } as ScoreBreakdown,
      notes: updates.notes ?? score.notes,
      naSections: updates.naSections ?? score.naSections,
    };
    scores.set(scoreId, updated);
    this.syncScoresToContest(realContestId);
    return { success: true, data: updated };
  }

  async delete(
    contestId: string,
    scoreId: string
  ): Promise<ProviderResult<void>> {
    const realContestId = this.getContestId(contestId);
    if (!realContestId) {
      return { success: false, error: 'Contest not found' };
    }
    const scores = this.store.scores.get(realContestId);
    if (!scores) {
      return { success: false, error: 'Contest not found' };
    }
    if (!scores.has(scoreId)) {
      return { success: false, error: 'Score not found' };
    }
    scores.delete(scoreId);
    this.syncScoresToContest(realContestId);
    return { success: true };
  }
}

class InMemoryConfigsProvider implements ConfigsProvider {
  constructor(private store: DataStore) {}

  async list(): Promise<ProviderResult<ContestConfigItem[]>> {
    return { success: true, data: Array.from(this.store.configs.values()) };
  }

  async getById(
    configId: string
  ): Promise<ProviderResult<ContestConfigItem | null>> {
    const config = this.store.configs.get(configId);
    if (!config) {
      return { success: false, error: 'Config not found' };
    }
    return { success: true, data: config };
  }

  async create(
    config: Omit<ContestConfigItem, 'id'> & { id?: string }
  ): Promise<ProviderResult<ContestConfigItem>> {
    const id = config.id ?? generateId('config');
    const newConfig: ContestConfigItem = { ...config, id };
    this.store.configs.set(id, newConfig);
    return { success: true, data: newConfig };
  }

  async update(
    configId: string,
    updates: Partial<ContestConfigItem>
  ): Promise<ProviderResult<ContestConfigItem>> {
    const config = this.store.configs.get(configId);
    if (!config) {
      return { success: false, error: 'Config not found' };
    }
    const updated = { ...config, ...updates };
    this.store.configs.set(configId, updated);
    return { success: true, data: updated };
  }

  async delete(configId: string): Promise<ProviderResult<void>> {
    if (!this.store.configs.has(configId)) {
      return { success: false, error: 'Config not found' };
    }
    this.store.configs.delete(configId);
    return { success: true };
  }
}

/**
 * Creates an in-memory backend provider for testing.
 */
export function createInMemoryBackendProvider(): BackendProvider {
  const store = createDataStore();

  return {
    name: 'in-memory',
    contests: new InMemoryContestsProvider(store),
    entries: new InMemoryEntriesProvider(store),
    judges: new InMemoryJudgesProvider(store),
    scores: new InMemoryScoresProvider(store),
    configs: new InMemoryConfigsProvider(store),

    async initialize(): Promise<ProviderResult<void>> {
      // Seed with default configs
      const defaultConfigs: ContestConfigItem[] = [
        {
          id: 'mixology',
          topic: 'Mixology',
          entryLabel: 'Drink',
          entryLabelPlural: 'Drinks',
          attributes: [
            {
              id: 'aroma',
              label: 'Aroma',
              description: 'How appealing is the scent?',
              min: 0,
              max: 10,
            },
            {
              id: 'taste',
              label: 'Taste',
              description: 'How well do the flavors work together?',
              min: 0,
              max: 10,
            },
            {
              id: 'presentation',
              label: 'Presentation',
              description: 'Visual appeal and garnish',
              min: 0,
              max: 10,
            },
            {
              id: 'xfactor',
              label: 'X Factor',
              description: 'Originality and innovation',
              min: 0,
              max: 10,
            },
            {
              id: 'overall',
              label: 'Overall',
              description: 'Overall impression',
              min: 0,
              max: 10,
            },
          ],
        },
        {
          id: 'chili',
          topic: 'Chili',
          entryLabel: 'Chili',
          entryLabelPlural: 'Chilies',
          attributes: [
            {
              id: 'heat',
              label: 'Heat',
              description: 'Spiciness level',
              min: 0,
              max: 10,
            },
            {
              id: 'flavor',
              label: 'Flavor',
              description: 'Depth and complexity',
              min: 0,
              max: 10,
            },
            {
              id: 'texture',
              label: 'Texture',
              description: 'Consistency',
              min: 0,
              max: 10,
            },
            {
              id: 'appearance',
              label: 'Appearance',
              description: 'Visual presentation',
              min: 0,
              max: 10,
            },
            {
              id: 'overall',
              label: 'Overall',
              description: 'Overall impression',
              min: 0,
              max: 10,
            },
          ],
        },
        {
          id: 'cosplay',
          topic: 'Cosplay',
          entryLabel: 'Cosplay',
          entryLabelPlural: 'Cosplays',
          attributes: [
            {
              id: 'accuracy',
              label: 'Accuracy',
              description: 'How accurate to the character',
              min: 0,
              max: 10,
            },
            {
              id: 'craftsmanship',
              label: 'Craftsmanship',
              description: 'Quality of construction',
              min: 0,
              max: 10,
            },
            {
              id: 'presentation',
              label: 'Presentation',
              description: 'Posing and performance',
              min: 0,
              max: 10,
            },
            {
              id: 'overall',
              label: 'Overall',
              description: 'Overall impression',
              min: 0,
              max: 10,
            },
          ],
        },
        {
          id: 'dance',
          topic: 'Dance',
          entryLabel: 'Performance',
          entryLabelPlural: 'Performances',
          attributes: [
            {
              id: 'technique',
              label: 'Technique',
              description: 'Technical skill and execution',
              min: 0,
              max: 10,
            },
            {
              id: 'choreography',
              label: 'Choreography',
              description: 'Quality of choreography',
              min: 0,
              max: 10,
            },
            {
              id: 'expression',
              label: 'Expression',
              description: 'Emotional expression',
              min: 0,
              max: 10,
            },
            {
              id: 'overall',
              label: 'Overall',
              description: 'Overall impression',
              min: 0,
              max: 10,
            },
          ],
        },
      ];

      for (const config of defaultConfigs) {
        store.configs.set(config.id, config);
      }

      return { success: true };
    },

    async dispose(): Promise<void> {
      store.contests.clear();
      store.entries.clear();
      store.judges.clear();
      store.scores.clear();
      store.configs.clear();
    },
  };
}

/**
 * Resets the in-memory store (useful between tests).
 */
export function createFreshInMemoryProvider(): BackendProvider {
  return createInMemoryBackendProvider();
}
