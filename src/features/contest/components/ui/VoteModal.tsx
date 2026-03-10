'use client';

import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import type { Contest } from '../../contexts/contest/contestTypes';
import { getRoundLabel } from '../../lib/domain/contestGetters';
import { useRoundVoting } from '../../lib/hooks/useRoundVoting';
import { VoteActions } from '../votePage/VoteActions';
import { VoteScorePanel } from './VoteScorePanel';

interface VoteModalProps {
  open: boolean;
  onClose: () => void;
  contest: Contest;
  roundId: string;
}

export function VoteModal({ open, onClose, contest, roundId }: VoteModalProps) {
  const roundName = getRoundLabel(contest, roundId);
  const { drinks, categories, scores, updateScore, submit, status, message, isSubmitting } =
    useRoundVoting(contest, roundId);

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
          <p>No entries in this round yet.</p>
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
