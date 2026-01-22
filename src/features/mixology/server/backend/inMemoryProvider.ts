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
  EntriesProvider,
  JudgesProvider,
  ScoresProvider,
  ProviderResult,
  Contest,
  Entry,
  Judge,
  ScoreEntry,
  ScoreBreakdown,
} from './types';
import { generateId, success, error } from './providerUtils';
import { CHILI_CONFIG, MIXOLOGY_CONFIG } from '../../types/templates';

// Seed data - same as the existing store.ts
function createSeedData(): Contest[] {
  return [
    {
      id: 'contest-cascadia-24',
      name: 'Cascadia Summer Throwdown',
      slug: 'cascadia-throwdown',
      phase: 'shake',
      config: MIXOLOGY_CONFIG,
      location: 'Portland Taproom',
      startTime: '2024-06-18T19:00:00Z',
      bracketRound: 'Round of 8',
      currentEntryId: 'entry-sea-fog',
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
        {
          id: 'entry-emberline',
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
          entryId: 'entry-sea-fog',
          judgeId: 'judge-mera',
          breakdown: { aroma: 8, balance: 9, presentation: 8, creativity: 9, overall: 9 },
          notes: 'Kelp salt plays nicely with citrus; garnish could be tighter.',
        },
        {
          id: 'score-2',
          entryId: 'entry-sea-fog',
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
      phase: 'set',
      config: MIXOLOGY_CONFIG,
      location: 'Seattle Warehouse',
      startTime: '2024-07-12T18:00:00Z',
      bracketRound: 'Qualifiers',
      entries: [],
      judges: [],
      scores: [],
    },
    {
      id: 'contest-summit-24',
      name: 'Summit Grand Tasting',
      slug: 'summit-grand-tasting',
      phase: 'shake',
      config: CHILI_CONFIG,
      location: 'Denver Summit Hall',
      startTime: '2024-09-22T17:30:00Z',
      bracketRound: 'Finals',
      currentEntryId: 'entry-ruby-ridge',
      defaultContest: false,
      rounds: [
        { id: 'round-1', name: 'Qualifiers', number: 1, state: 'scored' },
        { id: 'round-2', name: 'Finals', number: 2, state: 'shake' },
      ],
      activeRoundId: 'round-2',
      futureRoundId: 'round-2',
      categories: [
        { id: 'heat', label: 'Best Heat', description: 'Balanced spice level', sortOrder: 1 },
        { id: 'flavor', label: 'Best Flavor', description: 'Depth of flavor', sortOrder: 2 },
        { id: 'overall', label: 'Overall Favorite', description: 'Top overall entry', sortOrder: 3 },
      ],
      entries: [
        {
          id: 'entry-ruby-ridge',
          name: 'Ruby Ridge Red',
          slug: 'ruby-ridge-red',
          description: 'Smoky ancho base with charred tomato and cocoa nib finish.',
          round: 'Finals',
          submittedBy: 'Team Mesa',
        },
        {
          id: 'entry-golden-valley',
          name: 'Golden Valley Verde',
          slug: 'golden-valley-verde',
          description: 'Roasted tomatillo, serrano, and citrus zest with cumin crema.',
          round: 'Finals',
          submittedBy: 'Team Plateau',
        },
        {
          id: 'entry-riverstone',
          name: 'Riverstone Classic',
          slug: 'riverstone-classic',
          description: 'Slow-simmered chuck with toasted chili de árbol and oregano.',
          round: 'Qualifiers',
          submittedBy: 'Team Canyon',
        },
      ],
      judges: [
        { id: 'judge-hale', displayName: 'Hale J.', role: 'admin', contact: 'hale@example.com' },
        { id: 'judge-mira', displayName: 'Mira S.', role: 'judge', contact: 'mira@example.com' },
        { id: 'judge-olsen', displayName: 'Olsen P.', role: 'judge', contact: 'olsen@example.com' },
      ],
      scores: [
        {
          id: 'score-10',
          entryId: 'entry-ruby-ridge',
          judgeId: 'judge-mira',
          breakdown: { heat: 8, flavor: 9, texture: 8, appearance: 7, overall: 9 },
          notes: 'Great depth with a lingering cocoa note.',
        },
        {
          id: 'score-11',
          entryId: 'entry-ruby-ridge',
          judgeId: 'judge-olsen',
          breakdown: { heat: 7, flavor: 8, texture: 8, appearance: 8, overall: 8 },
          notes: 'Balanced spice; could use more brightness.',
        },
        {
          id: 'score-12',
          entryId: 'entry-golden-valley',
          judgeId: 'judge-mira',
          breakdown: { heat: 6, flavor: 8, texture: 9, appearance: 9, overall: 8 },
          notes: 'Fresh finish and great mouthfeel.',
        },
      ],
    },
  ];
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
        config: input.config ?? MIXOLOGY_CONFIG,
        entries: [],
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
 * Creates an in-memory entries provider
 */
function createEntriesProvider(getData: () => Contest[]): EntriesProvider {
  const findContest = (contestId: string) => getData().find((c) => c.id === contestId);

  return {
    async listByContest(contestId): Promise<ProviderResult<Entry[]>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.entries);
    },

    async getById(contestId, entryId): Promise<ProviderResult<Entry | null>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.entries.find((e) => e.id === entryId) ?? null);
    },

    async create(contestId, input): Promise<ProviderResult<Entry>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const newEntry: Entry = { ...input, id: generateId('entry') };
      contest.entries.push(newEntry);
      return success(newEntry);
    },

    async update(contestId, entryId, updates): Promise<ProviderResult<Entry>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const idx = contest.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return error('Entry not found');
      contest.entries[idx] = { ...contest.entries[idx], ...updates };
      return success(contest.entries[idx]);
    },

    async delete(contestId, entryId): Promise<ProviderResult<void>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      const idx = contest.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return error('Entry not found');
      contest.entries.splice(idx, 1);
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
      const newJudge: Judge = { ...input, id: input.id ?? generateId('judge') };
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
    async listByEntry(contestId, entryId): Promise<ProviderResult<ScoreEntry[]>> {
      const contest = findContest(contestId);
      if (!contest) return error('Contest not found');
      return success(contest.scores.filter((s) => s.entryId === entryId || s.drinkId === entryId));
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
      // Merge breakdown updates, filtering out undefined values
      const mergedBreakdown: ScoreBreakdown = { ...current.breakdown };
      if (updates.breakdown) {
        for (const [key, value] of Object.entries(updates.breakdown)) {
          if (typeof value === 'number') {
            mergedBreakdown[key] = value;
          }
        }
      }
      contest.scores[idx] = {
        ...current,
        breakdown: mergedBreakdown,
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

  const entriesProvider = createEntriesProvider(getData);

  return {
    name: 'in-memory',
    contests: createContestsProvider(getData),
    entries: entriesProvider,
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
