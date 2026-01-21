import { Contest, MixologyData } from '../types';

const mixologySeedData: MixologyData = {
  contests: [
    {
      id: 'contest-cascadia-24',
      name: 'Cascadia Summer Throwdown',
      slug: 'cascadia-throwdown',
      phase: 'shake',
      location: 'Portland Taproom',
      startTime: '2024-06-18T19:00:00Z',
      bracketRound: 'Round of 8',
      currentDrinkId: 'drink-sea-fog',
      defaultContest: true,
      entries: [
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
          entryId: 'drink-sea-fog',
          drinkId: 'drink-sea-fog',
          judgeId: 'judge-mera',
          breakdown: {
            aroma: 8,
            balance: 9,
            presentation: 8,
            creativity: 9,
            overall: 9,
          },
          notes: 'Kelp salt plays nicely with citrus; garnish could be tighter.',
        },
        {
          id: 'score-2',
          entryId: 'drink-sea-fog',
          drinkId: 'drink-sea-fog',
          judgeId: 'judge-roland',
          breakdown: {
            aroma: 9,
            balance: 8,
            presentation: 8,
            creativity: 8,
            overall: 8,
          },
          notes: 'Great backbone; consider dialing sweetness back a notch.',
        },
      ],
    },
    {
      id: 'contest-northstar-24',
      name: 'Northstar Invitational',
      slug: 'northstar-invitational',
      phase: 'set',
      location: 'Seattle Warehouse',
      startTime: '2024-07-12T18:00:00Z',
      bracketRound: 'Qualifiers',
      entries: [],
      judges: [],
      scores: [],
    },
  ],
};

export function listContests(): Contest[] {
  return mixologySeedData.contests;
}

export function getContestBySlug(slug: string): Contest | undefined {
  return mixologySeedData.contests.find((contest) => contest.slug === slug);
}

export function getDefaultContest(): Contest | undefined {
  return mixologySeedData.contests.find((contest) => contest.defaultContest);
}
