import type { PatternCode } from '../../engine';
import type { TracerMode, ComposerState } from '../../hooks/composer/composerState';
import type { ComposerView } from '../../hooks/composer/composerView';
import type { SubmitPhase } from '../../hooks/composer/useTurnSubmission';
import { actionHint } from './actionHint';
import { DeclarePicker } from './DeclarePicker';
import styles from './ActionBar.module.scss';

interface ActionBarProps {
  view: ComposerView;
  composer: ComposerState;
  phase: SubmitPhase;
  onTracerMode: (mode: TracerMode) => void;
  onUndo: () => void;
  onFinishChart: () => void;
  onDeclare: (pattern: PatternCode) => void;
  onSubmit: () => void;
}

interface ModeToggleProps {
  mode: TracerMode;
  /** Where Tracers can also step, the move mode is "Move", not just "Strike". */
  canStep: boolean;
  onChange: (mode: TracerMode) => void;
}

function ModeToggle({ mode, canStep, onChange }: ModeToggleProps) {
  return (
    <div className={styles.toggle} role="radiogroup" aria-label="Tracer action">
      {(['strike', 'chart'] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={mode === option}
          className={mode === option ? styles.toggleOn : styles.toggleOff}
          onClick={() => onChange(option)}
        >
          {option === 'chart' ? 'Chart' : canStep ? 'Move' : 'Strike'}
        </button>
      ))}
    </div>
  );
}

/** Guidance and the turn's buttons; sticky at the bottom on phones. */
export function ActionBar({ view, composer, phase, ...on }: ActionBarProps) {
  const busy = phase.kind === 'sending' || phase.kind === 'sent';
  const piece = view.selectedPiece;
  const canStep = view.board.rules.tracerStep;
  const picking = composer.tracerMode === 'land';
  const canToggle =
    !composer.main && !view.inspecting && !picking && piece?.kind === 'tracer' && (piece.pattern !== null || canStep);
  const hasDraft = Boolean(composer.main || composer.stepBefore || composer.selected || composer.chart);
  return (
    <section className={styles.bar} aria-label="Your turn">
      <p className={styles.hint} role="status" aria-live="polite">
        {actionHint(view, composer, phase)}
      </p>
      {phase.kind === 'failed' && <p className={styles.error}>{phase.message}</p>}
      {!composer.main && !view.inspecting && <DeclarePicker view={view} onDeclare={on.onDeclare} />}
      <div className={styles.buttons}>
        {canToggle && <ModeToggle mode={composer.tracerMode} canStep={canStep} onChange={on.onTracerMode} />}
        <button type="button" className={styles.quiet} onClick={on.onUndo} disabled={busy || !hasDraft}>
          Undo
        </button>
        {view.chart && !picking && (
          <button type="button" className={styles.quiet} onClick={on.onFinishChart} disabled={!view.chart.canFinish}>
            Done
          </button>
        )}
        <button type="button" className={styles.primary} onClick={on.onSubmit} disabled={busy || !view.outcome?.ok}>
          {phase.kind === 'failed' && phase.retryable ? 'Retry' : 'Submit turn'}
        </button>
      </div>
    </section>
  );
}
