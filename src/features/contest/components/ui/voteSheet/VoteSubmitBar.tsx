'use client';

interface VoteSubmitBarProps {
  total: number;
  maxTotal: number;
  label: string;
  disabled: boolean;
  onAction: () => void;
}

/**
 * Running total plus the one forward action. The button advances through the
 * entries and only submits on the last one, so its label carries the state.
 */
export function VoteSubmitBar({ total, maxTotal, label, disabled, onAction }: VoteSubmitBarProps) {
  return (
    <footer className="vote-sheet__submit-bar">
      <div>
        <span>Total</span>
        <strong>
          {total}
          <small> / {maxTotal}</small>
        </strong>
      </div>
      <button
        type="button"
        className="btn btn--primary"
        onClick={onAction}
        disabled={disabled}
      >
        {label}
      </button>
    </footer>
  );
}
