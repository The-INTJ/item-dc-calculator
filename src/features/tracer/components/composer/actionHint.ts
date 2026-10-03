/**
 * The one line of guidance above the turn buttons: what is staged, and what
 * the player can do next.
 */

import { describeAction, KIND_NAME, SIDE_NAME } from '../../lib/presentation/gameText';
import type { ComposerState } from '../../hooks/composer/composerState';
import type { ComposerView } from '../../hooks/composer/composerView';
import type { SubmitPhase } from '../../hooks/composer/useTurnSubmission';

function stagedHint(view: ComposerView, composer: ComposerState): string | null {
  const actions = view.outcome?.ok ? view.outcome.record.actions : [];
  const summary = actions.map(describeAction).join(', then ');
  if (view.kingTurn) return `${summary}. A king move is the whole turn — submit when ready.`;
  if (composer.main) {
    return composer.stepBefore || composer.stepAfter
      ? `${summary}. Submit when ready.`
      : `${summary}. Tap your king for a free step, or submit.`;
  }
  if (composer.stepBefore) {
    return `King steps to ${composer.stepBefore}. Submit that as your turn, or also move a Tracer or Warden.`;
  }
  return null;
}

function chartHint(view: ComposerView, origin: string): string {
  const chart = view.chart;
  if (!chart || chart.squares.length === 0) {
    return `Charting from ${origin}: tap neighbouring squares to draw a path — through pieces makes a jumper.`;
  }
  const steps = `${chart.squares.length} step${chart.squares.length === 1 ? '' : 's'}`;
  if (!chart.canFinish) return `${steps} — a path cannot end on a piece, keep going.`;
  return `${steps} · ${chart.kind === 'jumper' ? 'Jumper' : 'Rider'} — tap Done, or keep drawing.`;
}

export function actionHint(view: ComposerView, composer: ComposerState, phase: SubmitPhase): string {
  if (phase.kind === 'sending') return 'Sending your turn…';
  if (phase.kind === 'sent') return 'Sent — waiting for the board to update…';
  const staged = stagedHint(view, composer);
  if (staged && !composer.selected) return staged;
  const piece = view.selectedPiece;
  if (!piece) return staged ?? 'Tap one of your pieces to start your turn.';
  if (view.inspecting) return `Looking at the ${SIDE_NAME[piece.side]} ${KIND_NAME[piece.kind]}.`;
  if (piece.kind === 'tracer' && composer.tracerMode === 'chart') return chartHint(view, piece.at);
  if (view.stepTargets.length > 0) return 'Tap a marked square for the free king step.';
  if (piece.kind === 'king') return 'Step one square, or use a pattern from the king’s library.';
  if (piece.kind === 'tracer') return 'Strike: tap a highlighted square — or switch to Chart.';
  return 'Tap a highlighted square to move.';
}
