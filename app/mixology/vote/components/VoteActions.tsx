import type { SubmitStatus } from '../hooks';

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
    <div className="mixology-vote-actions">
      <button
        type="button"
        className="button-primary"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit scores'}
      </button>
      {message && (
        <p className={`mixology-vote-actions__message mixology-vote-actions__message--${status}`}>
          {message}
        </p>
      )}
    </div>
  );
}
