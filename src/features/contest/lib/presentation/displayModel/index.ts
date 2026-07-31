/**
 * Public seam for the contest display model. Consumers import from
 * `presentation/displayModel` exactly as they did when this was a single file.
 */
export { buildDisplayModel } from './buildDisplayModel';
export type {
  DisplayChampion,
  DisplayContestant,
  DisplayMatchup,
  DisplayModel,
  DisplayRound,
  FeaturedMatchupMode,
} from './displayModelTypes';
