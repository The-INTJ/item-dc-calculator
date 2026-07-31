import type {
  ContestActions,
  ContestContextState,
  ContestContextStateUpdater,
} from '../contestTypes';
import { useContestListActions } from './useContestListActions';
import { useRoundActions } from './useRoundActions';
import { useContestantActions } from './useContestantActions';
import { useMatchupActions } from './useMatchupActions';

/**
 * Provides all contest + matchup mutation actions. Each action calls the API
 * and then reconciles local state (either a full-contest replace or a
 * per-matchup patch in `matchupsByContestId`).
 *
 * Composed from one hook per action group: contest collection, rounds,
 * contestants, and matchups.
 */
export function useContestActions(
  state: ContestContextState,
  updateState: (updater: ContestContextStateUpdater) => void,
): ContestActions {
  const {
    getContestById,
    replaceContest,
    updateContest,
    upsertContest,
    addContest,
    deleteContest,
  } = useContestListActions(state, updateState);

  const { addRound, updateRound, removeRound, setRoundOverride } = useRoundActions(
    getContestById,
    replaceContest,
  );

  const { addContestant, updateContestant, removeContestant } = useContestantActions(updateState);

  const {
    setMatchupsForContest,
    updateMatchup,
    setMatchupEntryName,
    seedRound,
    createMatchup,
    deleteMatchup,
  } = useMatchupActions(updateState);

  return {
    updateContest,
    upsertContest,
    addContest,
    deleteContest,
    addRound,
    updateRound,
    removeRound,
    setRoundOverride,
    addContestant,
    updateContestant,
    removeContestant,
    setMatchupsForContest,
    updateMatchup,
    setMatchupEntryName,
    seedRound,
    createMatchup,
    deleteMatchup,
  };
}
