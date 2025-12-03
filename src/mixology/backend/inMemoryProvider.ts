/**
 * In-memory backend provider implementation.
 *
 * This provider stores data in-memory using the existing seed data.
 * Useful for local development and testing without external dependencies.
 * Can be swapped out for Firebase, Supabase, or any other provider
 * by implementing MixologyBackendProvider.
 */

import type {
  MixologyBackendProvider,
  ContestsProvider,
  DrinksProvider,
  JudgesProvider,
  ScoresProvider,
  ProviderResult,
  Contest,
  Drink,
  Judge,
  ScoreEntry,
  ScoreBreakdown,
} from './types';

// Seed data - same as the existing store.ts
function createSeedData(): Contest[] {
  return [
    {
      id: 'contest-cascadia-24',
      name: 'Cascadia Summer Throwdown',
      slug: 'cascadia-throwdown',
      phase: 'active',
      location: 'Portland Taproom',
      startTime: '2024-06-18T19:00:00Z',
      bracketRound: 'Round of 8',
      currentDrinkId: 'drink-sea-fog',
      defaultContest: true,
      drinks: [
        {
          id: 'drink-sea-fog',
          name: 'Sea Fog Collins',
          slug: 'sea-fog-collins',
          description: 'Gin, kelp simple syrup, yuzu, saline, and soda with dill garnish.',
          round: 'Round of 8',
          submittedBy: 'Team Estuary',
        },
        {
          id: 'drink-emberline',
          name: 'Emberline Old Fashioned',
          slug: 'emberline-old-fashioned',
          description: 'Smoked rye, burnt sugar bitters, espresso tincture, orange oil.',
          round: 'Round of 8',
          submittedBy: 'Team Forge',
        },
      ],
      judges: [
        { id: 'judge-afton', displayName: 'Afton L.', role: 'admin', contact: 'afton@example.com' },
        { id: 'judge-mera', displayName: 'Mera K.', role: 'judge' },
        { id: 'judge-roland', displayName: 'Roland T.', role: 'judge' },
      ],
      scores: [
        {
          id: 'score-1',
          drinkId: 'drink-sea-fog',
          judgeId: 'judge-mera',
          breakdown: { aroma: 8, balance: 9, presentation: 8, creativity: 9, overall: 9 },
          notes: 'Kelp salt plays nicely with citrus; garnish could be tighter.',
        },
        {
          id: 'score-2',
          drinkId: 'drink-sea-fog',
          judgeId: 'judge-roland',
          breakdown: { aroma: 9, balance: 8, presentation: 8, creativity: 8, overall: 8 },
          notes: 'Great backbone; consider dialing sweetness back a notch.',
        },
      ],
    },
    {
      id: 'contest-northstar-24',
      name: 'Northstar Invitational',
      slug: 'northstar-invitational',
      phase: 'setup',
      location: 'Seattle Warehouse',
      startTime: '2024-07-12T18:00:00Z',
      bracketRound: 'Qualifiers',
      drinks: [],
      judges: [],
      scores: [],
    },
  ];
}

// Helper to generate unique IDs
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to wrap successful results
function success<T>(data: T): ProviderResult<T> {
  return { success: true, data };
}

// Helper to wrap error results
function error<T>(message: string): ProviderResult<T> {
  return { success: false, error: message };
}

/**
 * Creates an in-memory contests provider
 */
function createContestsProvider(getData: () => Contest[]): ContestsProvider {
  return {
    async list(): Promise<ProviderResult<Contest[]>> {
      return success(getData());
    },

    async getBySlug(slug: string): Promise<ProviderResult<Contest | null>> {
      const contest = getData().find((c) => c.slug === slug);
      return success(contest ?? null);
    },

    async getDefault(): Promise<ProviderResult<Contest | null>> {
      const contest = getData().find((c) => c.defaultContest);
      return success(contest ?? null);
    },

    async create(input): Promise<ProviderResult<Contest>> {
      const contests = getData();
      const newContest: Contest = {
        ...input,
        id: generateId('contest'),
        drinks: [],
        judges: [],
        scores: [],
      };
      contests.push(newContest);
      return success(newContest);
    },

    async update(id, updates): Promise<ProviderResult<Contest>> {
      const contests = getData();
      const idx = contests.findIndex((c) => c.id === id);
      if (idx === -1) return error('Contest not found');
      contests[idx] = { ...contests[idx], ...updates };
      return success(contests[idx]);
    },

    async delete(id): Promise<ProviderResult<void>> {
      const contests = getData();
      const idx = contests.findIndex((c) => c.id === id);
      if (idx === -1) return error('Contest not found');
      contests.splice(idx, 1);
      return success(undefined);
    },

    async setDefault(id): Promise<ProviderResult<Contest>> {
      const contests = getData();
      const target = contests.find((c) => c.id === id);
      if (!target) return error('Contest not found');
      contests.forEach((c) => (c.defaultContest = c.id === id));
      return success(target);
    },
  };
}

/**
 * Creates an in-memory drinks provider
 */
function createDrinksProvider(getData: () => Contest[]): DrinksProvider {
  const findContest = (contestId: string) => getData().find((c) => c.id === contestId);

  return {
    async listByContest(contestId): Promise<ProviderResult<Drink[]>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.drinks);
    },

    async getById(contestId, drinkId): Promise<ProviderResult<Drink | null>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.drinks.find((d) => d.id === drinkId) ?? null);
    },

    async create(contestId, input): Promise<ProviderResult<Drink>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const newDrink: Drink = { ...input, id: generateId('drink') };
      contest.drinks.push(newDrink);
      return success(newDrink);
    },

    async update(contestId, drinkId, updates): Promise<ProviderResult<Drink>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const idx = contest.drinks.findIndex((d) => d.id === drinkId);
      if (idx === -1) return error('Drink not found');
      contest.drinks[idx] = { ...contest.drinks[idx], ...updates };
      return success(contest.drinks[idx]);
    },

    async delete(contestId, drinkId): Promise<ProviderResult<void>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const idx = contest.drinks.findIndex((d) => d.id === drinkId);
      if (idx === -1) return error('Drink not found');
      contest.drinks.splice(idx, 1);
      return success(undefined);
    },
  };
}

/**
 * Creates an in-memory judges provider
 */
function createJudgesProvider(getData: () => Contest[]): JudgesProvider {
  const findContest = (contestId: string) => getData().find((c) => c.id === contestId);

  return {
    async listByContest(contestId): Promise<ProviderResult<Judge[]>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.judges);
    },

    async getById(contestId, judgeId): Promise<ProviderResult<Judge | null>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.judges.find((j) => j.id === judgeId) ?? null);
    },

    async create(contestId, input): Promise<ProviderResult<Judge>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const newJudge: Judge = { ...input, id: generateId('judge') };
      contest.judges.push(newJudge);
      return success(newJudge);
    },

    async update(contestId, judgeId, updates): Promise<ProviderResult<Judge>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const idx = contest.judges.findIndex((j) => j.id === judgeId);
      if (idx === -1) return error('Judge not found');
      contest.judges[idx] = { ...contest.judges[idx], ...updates };
      return success(contest.judges[idx]);
    },

    async delete(contestId, judgeId): Promise<ProviderResult<void>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const idx = contest.judges.findIndex((j) => j.id === judgeId);
      if (idx === -1) return error('Judge not found');
      contest.judges.splice(idx, 1);
      return success(undefined);
    },
  };
}

/**
 * Creates an in-memory scores provider
 */
function createScoresProvider(getData: () => Contest[]): ScoresProvider {
  const findContest = (contestId: string) => getData().find((c) => c.id === contestId);

  return {
    async listByDrink(contestId, drinkId): Promise<ProviderResult<ScoreEntry[]>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.scores.filter((s) => s.drinkId === drinkId));
    },

    async listByJudge(contestId, judgeId): Promise<ProviderResult<ScoreEntry[]>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.scores.filter((s) => s.judgeId === judgeId));
    },

    async getById(contestId, scoreId): Promise<ProviderResult<ScoreEntry | null>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.scores.find((s) => s.id === scoreId) ?? null);
    },

    async submit(contestId, input): Promise<ProviderResult<ScoreEntry>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const newScore: ScoreEntry = { ...input, id: generateId('score') };
      contest.scores.push(newScore);
      return success(newScore);
    },

    async update(contestId, scoreId, updates): Promise<ProviderResult<ScoreEntry>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const idx = contest.scores.findIndex((s) => s.id === scoreId);
      if (idx === -1) return error('Score not found');

      const current = contest.scores[idx];
      contest.scores[idx] = {
        ...current,
        breakdown: { ...current.breakdown, ...updates } as ScoreBreakdown,
        notes: updates.notes ?? current.notes,
      };
      return success(contest.scores[idx]);
    },

    async delete(contestId, scoreId): Promise<ProviderResult<void>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const idx = contest.scores.findIndex((s) => s.id === scoreId);
      if (idx === -1) return error('Score not found');
      contest.scores.splice(idx, 1);
      return success(undefined);
    },
  };
}

/**
 * Creates the full in-memory backend provider
 */
export function createInMemoryProvider(): MixologyBackendProvider {
  let data: Contest[] = [];

  const getData = () => data;

  return {
    name: 'in-memory',
    contests: createContestsProvider(getData),
    drinks: createDrinksProvider(getData),
    judges: createJudgesProvider(getData),
    scores: createScoresProvider(getData),

    async initialize(): Promise<ProviderResult<void>> {
      data = createSeedData();
      return success(undefined);
    },

    async dispose(): Promise<void> {
      data = [];
    },
  };
}
