/**
 * The one line of guidance above the turn buttons: what is staged, and what
 * the player can do next.
 */

import { describeAction, SIDE_NAME } from '../../lib/presentation/gameText';
import { pieceName, stepCompanions } from '../../lib/presentation/ruleText';
import type { ComposerState } from '../../hooks/composer/composerState';
import type { ComposerView } from '../../hooks/composer/composerView';
import type { SubmitPhase } from '../../hooks/composer/useTurnSubmission';

function stagedHint(view: ComposerView, composer: ComposerState): string | null {
  const actions = view.outcome?.ok ? view.outcome.record.actions : [];
  const summary = actions.map(describeAction).join(', then ');
  if (view.kingTurn) return `${summary}. A king move is the whole turn — submit when ready.`;
  if (composer.main) {
    const open = view.stepWithMain && !composer.stepBefore && !composer.stepAfter;
    return open ? `${summary}. Tap your king for a free step, or submit.` : `${summary}. Submit when ready.`;
  }
  if (composer.stepBefore) {
    const companions = stepCompanions(view.board.rules) ?? 'piece';
    return `King steps to ${composer.stepBefore}. Submit that as your turn, or also move a ${companions}.`;
  }
  return null;
}

function chartHint(view: ComposerView, origin: string): string {
  const chart = view.chart;
  if (!chart || chart.squares.length === 0) {
    const limit = chart?.limit ? ` up to ${chart.limit} squares` : '';
    return `Charting from ${origin}: tap neighbouring squares to draw a path${limit} — through pieces makes a jumper.`;
  }
  const drawn = chart.squares.length;
  const steps = chart.limit ? `${drawn} of ${chart.limit} steps` : `${drawn} ${drawn === 1 ? 'step' : 'steps'}`;
  const stuck = chart.next.length === 0;
  if (!chart.canFinish) {
    return stuck ? `${steps} — this ends on a piece. Back up a step.` : `${steps} — a path cannot end on a piece, keep going.`;
  }
  const kind = chart.kind === 'jumper' ? 'Jumper' : 'Rider';
  return stuck ? `${steps} · ${kind} — tap Done.` : `${steps} · ${kind} — tap Done, or keep drawing.`;
}

function kingHint(view: ComposerView): string {
  const rules = view.board.rules;
  if (rules.kingMemory === 'none') return 'Step one square in any direction.';
  if (rules.kingBorrow !== 'declared') return 'Step one square, or move by one of the king’s patterns (see Kings).';
  return view.selectedPiece?.pattern
    ? 'Step one square, move by the declared route, or declare another below (that is your whole turn).'
    : 'Step one square — or declare one of your Tracers’ routes below to move by it from next turn.';
}

function tracerMoveHint(view: ComposerView): string {
  if (!view.board.rules.tracerStep) return 'Strike: tap a highlighted square — or switch to Chart.';
  return view.selectedPiece?.pattern
    ? 'Step to a neighbouring square (no capture), or strike along its route — or switch to Chart.'
    : 'Step to a neighbouring square (no capture) — or switch to Chart to trace its route.';
}

export function actionHint(view: ComposerView, composer: ComposerState, phase: SubmitPhase): string {
  if (phase.kind === 'sending') return 'Sending your turn…';
  if (phase.kind === 'sent') return 'Sent — waiting for the board to update…';
  const staged = stagedHint(view, composer);
  if (staged && !composer.selected) return staged;
  const piece = view.selectedPiece;
  if (!piece) return staged ?? 'Tap one of your pieces to start your turn.';
  if (view.inspecting) return `Looking at the ${SIDE_NAME[piece.side]} ${pieceName(piece, view.board.rules)}.`;
  if (piece.kind === 'tracer' && composer.tracerMode === 'land') {
    return 'Where does the Tracer stop? Tap it to stay, or tap a marked square along the path.';
  }
  if (piece.kind === 'tracer' && composer.tracerMode === 'chart') return chartHint(view, piece.at);
  if (view.stepTargets.length > 0) return 'Tap a marked square for the free king step.';
  if (piece.kind === 'king') return kingHint(view);
  if (piece.kind === 'tracer') return tracerMoveHint(view);
  return 'Tap a highlighted square to move.';
}
