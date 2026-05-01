import type { ContestConfig } from '../../contexts/contest/contestTypes';

export type ContestDisplayKind = 'generic' | 'mixology';

export interface ContestDisplaySurface {
  kind: ContestDisplayKind;
  rootClassName: string;
  eyebrowIcon: string;
  nowPanelLabel: string;
  standbyPanelLabel: string;
  nextPanelLabel: string;
  feedLabel: string;
  feedActiveMessage: string;
  feedStandbyMessage: string;
  activeSpotlightLabel: string;
  standbySpotlightLabel: string;
  centerIcon: string;
  contestantIcon: string;
  sideIcons: string[];
  rainIcons: string[];
}

const GENERIC_SURFACE: ContestDisplaySurface = {
  kind: 'generic',
  rootClassName: 'contest-display--generic',
  eyebrowIcon: 'sensors',
  nowPanelLabel: 'Now Scoring',
  standbyPanelLabel: 'Standby',
  nextPanelLabel: 'Up Next',
  feedLabel: 'Vote feed',
  feedActiveMessage: 'Scores are moving from cached entry aggregates.',
  feedStandbyMessage: 'Waiting for the host to open a live matchup.',
  activeSpotlightLabel: 'Game is active',
  standbySpotlightLabel: 'No game is currently in shake mode',
  centerIcon: 'bolt',
  contestantIcon: 'emoji_events',
  sideIcons: ['star', 'bolt', 'emoji_events', 'sensors'],
  rainIcons: ['star', 'bolt', 'emoji_events', 'sensors'],
};

const MIXOLOGY_SURFACE: ContestDisplaySurface = {
  kind: 'mixology',
  rootClassName: 'contest-display--mixology',
  eyebrowIcon: 'local_bar',
  nowPanelLabel: 'Now Shaking',
  standbyPanelLabel: 'Shake Standby',
  nextPanelLabel: 'On Deck',
  feedLabel: 'Pour feed',
  feedActiveMessage: 'Shakers are moving. Scores pour in from cached drink aggregates.',
  feedStandbyMessage: 'No shaker is live yet. The bar is stocked and watching.',
  activeSpotlightLabel: 'Game is active',
  standbySpotlightLabel: 'No game is currently in shake mode',
  centerIcon: 'local_bar',
  contestantIcon: 'liquor',
  sideIcons: ['liquor', 'local_bar', 'wine_bar', 'water_drop', 'icecream', 'celebration'],
  rainIcons: [
    'local_bar',
    'liquor',
    'wine_bar',
    'sports_bar',
    'water_drop',
    'icecream',
    'celebration',
    'science',
  ],
};

export function normalizeContestKind(config?: ContestConfig): ContestDisplayKind {
  const topic = config?.topic ?? '';
  const entryLabel = config?.entryLabel ?? '';
  const entryLabelPlural = config?.entryLabelPlural ?? '';
  const contestantLabel = config?.contestantLabel ?? '';
  const source = `${topic} ${entryLabel} ${entryLabelPlural} ${contestantLabel}`.toLowerCase();

  if (
    source.includes('mixology') ||
    source.includes('cocktail') ||
    source.includes('drink') ||
    source.includes('mixologist')
  ) {
    return 'mixology';
  }

  return 'generic';
}

export function getContestDisplaySurface(kind: ContestDisplayKind): ContestDisplaySurface {
  return kind === 'mixology' ? MIXOLOGY_SURFACE : GENERIC_SURFACE;
}
