import type {
  MixologyBackendProvider,
  ContestsProvider,
  EntriesProvider,
  JudgesProvider,
  ScoresProvider,
  ProviderResult,
  Contest,
  Entry,
  Judge,
  ScoreEntry,
} from './types';
import { generateId, success, error } from './providerUtils';
import { normalizeScorePayload } from './scoreNormalization';
import { MIXOLOGY_CONFIG } from '../../types/templates';

const SEED_DATA: Contest[] = [
  {
    id: 'contest-cascadia-24',
    name: 'Cascadia Summer Throwdown',
    slug: 'cascadia-throwdown',
    phase: 'shake',
    defaultContest: true,
    entries: [
      {
        id: 'entry-sea-fog',
        name: 'Sea Fog Collins',
        slug: 'sea-fog-collins',
        description: 'Gin, kelp simple syrup, yuzu, saline, and soda with dill garnish.',
        round: 'Round of 8',
        submittedBy: 'Team Estuary',
      },
    ],
    judges: [
      { id: 'judge-mera', displayName: 'Mera K.', role: 'judge' },
    ],
    scores: [
      {
        id: 'score-1',
        entryId: 'entry-sea-fog',
        judgeId: 'judge-mera',
        breakdown: { aroma: 8, balance: 9, presentation: 8, creativity: 9, overall: 9 },
      },
    ],
  },
];

const createSeedData = (): Contest[] => JSON.parse(JSON.stringify(SEED_DATA));

type CollectionKey = 'entries' | 'judges';
type CollectionItem<K extends CollectionKey> = Contest[K][number];

const createWithContest = (getData: () => Contest[]) => <Result>(
  contestId: string,
  handler: (contest: Contest) => ProviderResult<Result>
): ProviderResult<Result> => {
  const contest = getData().find((c) => c.id === contestId);
  return contest ? handler(contest) : error('Contest not found');
};

const createCollectionProvider = <K extends CollectionKey, CreateInput>(
  getData: () => Contest[],
  key: K,
  createItem: (input: CreateInput) => CollectionItem<K>,
  label: string
) => {
  type Item = CollectionItem<K>;
  const withContest = createWithContest(getData);
  const getCollection = (contest: Contest) => contest[key];

  return {
    listByContest: async (contestId: string) =>
      withContest(contestId, (contest) => success(getCollection(contest))),
    getById: async (contestId: string, id: string) =>
      withContest(contestId, (contest) =>
        success(getCollection(contest).find((item) => item.id === id) ?? null)
      ),
    create: async (contestId: string, input: CreateInput) =>
      withContest(contestId, (contest) => {
        const newItem = createItem(input);
        getCollection(contest).push(newItem);
        return success(newItem);
      }),
    update: async (contestId: string, id: string, updates: Partial<Item>) =>
      withContest(contestId, (contest) => {
        const collection = getCollection(contest);
        const idx = collection.findIndex((item) => item.id === id);
        if (idx === -1) return error(`${label} not found`);
        collection[idx] = { ...collection[idx], ...updates };
        return success(collection[idx]);
      }),
    delete: async (contestId: string, id: string) =>
      withContest(contestId, (contest) => {
        const collection = getCollection(contest);
        const idx = collection.findIndex((item) => item.id === id);
        if (idx === -1) return error(`${label} not found`);
        collection.splice(idx, 1);
        return success(undefined);
      }),
  };
};

const createContestsProvider = (getData: () => Contest[]): ContestsProvider => ({
  list: async () => success(getData()),
  getBySlug: async (slug) => success(getData().find((c) => c.slug === slug) ?? null),
  getDefault: async () => success(getData().find((c) => c.defaultContest) ?? null),
  create: async (input) => {
    const contests = getData();
    const newContest: Contest = {
      ...input,
      id: generateId('contest'),
      config: input.config ?? MIXOLOGY_CONFIG,
      entries: [],
      judges: [],
      scores: [],
    };
    contests.push(newContest);
    return success(newContest);
  },
  update: async (id, updates) => {
    const contests = getData();
    const idx = contests.findIndex((c) => c.id === id);
    if (idx === -1) return error('Contest not found');
    contests[idx] = { ...contests[idx], ...updates };
    return success(contests[idx]);
  },
  delete: async (id) => {
    const contests = getData();
    const idx = contests.findIndex((c) => c.id === id);
    if (idx === -1) return error('Contest not found');
    contests.splice(idx, 1);
    return success(undefined);
  },
  setDefault: async (id) => {
    const contests = getData();
    const target = contests.find((c) => c.id === id);
    if (!target) return error('Contest not found');
    contests.forEach((c) => (c.defaultContest = c.id === id));
    return success(target);
  },
});

const createScoresProvider = (getData: () => Contest[]): ScoresProvider => {
  const withContest = createWithContest(getData);

  return {
    listByEntry: async (contestId, entryId) =>
      withContest(contestId, (contest) =>
        success(contest.scores.filter((s) => s.entryId === entryId || s.drinkId === entryId))
      ),
    listByJudge: async (contestId, judgeId) =>
      withContest(contestId, (contest) => success(contest.scores.filter((s) => s.judgeId === judgeId))),
    getById: async (contestId, scoreId) =>
      withContest(contestId, (contest) => success(contest.scores.find((s) => s.id === scoreId) ?? null)),
    submit: async (contestId, input) =>
      withContest(contestId, (contest) => {
        try {
          const normalized = normalizeScorePayload({
            contest,
            updates: input.breakdown,
            naSections: input.naSections,
          });
          const newScore: ScoreEntry = {
            ...input,
            id: generateId('score'),
            breakdown: normalized.breakdown,
            naSections: normalized.naSections,
          };
          contest.scores.push(newScore);
          return success(newScore);
        } catch (err) {
          return error(err instanceof Error ? err.message : 'Invalid score payload');
        }
      }),
    update: async (contestId, scoreId, updates) =>
      withContest(contestId, (contest) => {
        const idx = contest.scores.findIndex((s) => s.id === scoreId);
        if (idx === -1) return error('Score not found');

        const current = contest.scores[idx];
        const mergedNaSections = updates.naSections ?? current.naSections;
        try {
          const normalized = normalizeScorePayload({
            contest,
            baseBreakdown: current.breakdown,
            updates: updates.breakdown,
            naSections: mergedNaSections,
          });

          contest.scores[idx] = {
            ...current,
            breakdown: normalized.breakdown,
            notes: updates.notes ?? current.notes,
            naSections: normalized.naSections,
          };
          return success(contest.scores[idx]);
        } catch (err) {
          return error(err instanceof Error ? err.message : 'Invalid score payload');
        }
      }),
    delete: async (contestId, scoreId) =>
      withContest(contestId, (contest) => {
        const idx = contest.scores.findIndex((s) => s.id === scoreId);
        if (idx === -1) return error('Score not found');
        contest.scores.splice(idx, 1);
        return success(undefined);
      }),
  };
};

export function createInMemoryProvider(): MixologyBackendProvider {
  let data: Contest[] = [];
  const getData = () => data;

  return {
    name: 'in-memory',
    contests: createContestsProvider(getData),
    entries: createCollectionProvider<Entry, Omit<Entry, 'id'>>(
      getData,
      'entries',
      (input) => ({ ...input, id: generateId('entry') }),
      'Entry'
    ) as EntriesProvider,
    judges: createCollectionProvider<Judge, Omit<Judge, 'id'> & { id?: string }>(
      getData,
      'judges',
      (input) => ({ ...input, id: input.id ?? generateId('judge') }),
      'Judge'
    ) as JudgesProvider,
    scores: createScoresProvider(getData),
    initialize: async (): Promise<ProviderResult<void>> => {
      data = createSeedData();
      return success(undefined);
    },
    dispose: async (): Promise<void> => {
      data = [];
    },
  };
}
