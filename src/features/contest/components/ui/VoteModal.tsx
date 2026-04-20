'use client';

import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import type { Contest, Matchup } from '../../contexts/contest/contestTypes';
import { getRoundLabel } from '../../lib/domain/contestGetters';
import { useMatchupVoting } from '../../lib/hooks/useMatchupVoting';
import { VoteActions } from '../votePage/VoteActions';
import { VoteScorePanel } from './VoteScorePanel';

interface VoteModalProps {
  open: boolean;
  onClose: () => void;
  contest: Contest;
  matchup: Matchup;
}

export function VoteModal({ open, onClose, contest, matchup }: VoteModalProps) {
  const roundName = getRoundLabel(contest, matchup.roundId);
  const { drinks, categories, scores, updateScore, submit, status, message, isSubmitting } =
    useMatchupVoting(contest, matchup);

  const canSubmit = drinks.length > 0 && categories.length > 0 && !isSubmitting;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {roundName} - Vote
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <span className="material-symbols-outlined">close</span>
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {drinks.length === 0 ? (
          <p>No entries assigned to this matchup yet.</p>
        ) : (
          <VoteScorePanel
            drinks={drinks}
            categories={categories}
            totals={[]}
            scoreByDrinkId={scores}
            onScoreChange={updateScore}
            className="vote-modal-scores"
          />
        )}
      </DialogContent>

      <DialogActions>
        <VoteActions
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          status={status}
          message={message}
          onSubmit={() => void submit()}
        />
      </DialogActions>
    </Dialog>
  );
}
