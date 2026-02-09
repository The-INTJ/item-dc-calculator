import type { SubmitStatus } from '../../lib/hooks/useRoundVoting';

interface VoteActionsProps {
  canSubmit: boolean;
  isSubmitting: boolean;
  status: SubmitStatus;
  message: string | null;
  onSubmit: () => void;
}

export function VoteActions({
  canSubmit,
  isSubmitting,
  status,
  message,
  onSubmit,
}: VoteActionsProps) {
  return (
    <div className="contest-vote-actions">
      <button
        type="button"
        className="button-primary"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit scores'}
      </button>
      {message && (
        <p className={`contest-vote-actions__message contest-vote-actions__message--${status}`}>
          {message}
        </p>
      )}
    </div>
  );
}
