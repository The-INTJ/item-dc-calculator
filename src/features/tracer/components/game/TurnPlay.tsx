'use client';

import type { ReactNode } from 'react';

import { attackedSquares, otherSide, type Side } from '../../engine';
import type { ComposerView } from '../../hooks/composer/composerView';
import { useTurnComposer } from '../../hooks/composer/useTurnComposer';
import { useTurnSubmission, type TurnWarning } from '../../hooks/composer/useTurnSubmission';
import type { Viewer } from '../../lib/policy';
import type { TracerGame } from '../../lib/types';
import { Board } from '../board/Board';
import { boardMarks } from '../board/boardMarks';
import { overlayLines } from '../board/overlayModel';
import { ActionBar } from '../composer/ActionBar';
import { ConfirmSheet } from '../shared/Sheet';
import styles from './Game.module.scss';

const WARNINGS: Record<TurnWarning, { title: string; body: string; confirm: string }> = {
  'king-in-danger': {
    title: 'Your king can be captured',
    body: 'After this turn your opponent could take your king and win. Submit anyway?',
    confirm: 'Submit anyway',
  },
  'streak-draw': {
    title: 'This step draws the game',
    body: 'That is your sixth free king step in a row with no capture, which ends the game in a draw.',
    confirm: 'Draw the game',
  },
};

interface TurnPlayProps {
  game: TracerGame;
  viewer: Viewer;
  orientation: Side;
  showThreats: boolean;
  topBar: ReactNode;
  bottomBar: ReactNode;
  toolbar: ReactNode;
  status: ReactNode;
  panels: (view: ComposerView) => ReactNode;
}

/**
 * One turn's worth of play. Keyed by ply by its parent, so every new turn —
 * yours or a live update from your opponent — starts from a clean slate.
 */
export function TurnPlay({ game, viewer, orientation, showThreats, ...slots }: TurnPlayProps) {
  const { composer, view, dispatch, tap, finishChart } = useTurnComposer(game, viewer);
  const submission = useTurnSubmission(game.id, viewer.actingSide, () => dispatch({ type: 'reset' }));
  const { phase } = submission;
  const busy = phase.kind === 'sending' || phase.kind === 'sent';
  const threats = showThreats ? attackedSquares(view.board, otherSide(orientation)) : [];
  const marks = boardMarks(view, view.outcome?.ok ? null : game.lastTurn, threats);
  const lines = overlayLines(view, composer.selected, game.lastTurn, orientation);
  const warning = phase.kind === 'confirm' ? WARNINGS[phase.warnings[0]] : null;

  return (
    <div className={styles.table}>
      <section className={styles.boardColumn} aria-label="Board">
        {slots.topBar}
        <Board
          board={view.board}
          orientation={orientation}
          marks={marks}
          lines={lines}
          label="Tracer board"
          onTap={(square) => !busy && tap(square)}
        />
        {slots.bottomBar}
        {slots.toolbar}
      </section>
      <section className={styles.sideColumn}>
        {slots.status}
        {viewer.canMove && (
          <ActionBar
            view={view}
            composer={composer}
            phase={phase}
            onTracerMode={(mode) => dispatch({ type: 'setTracerMode', mode })}
            onUndo={() => dispatch({ type: 'undo' })}
            onFinishChart={finishChart}
            onSubmit={() => submission.submit(view.turn, view.outcome)}
          />
        )}
        {slots.panels(view)}
      </section>
      <ConfirmSheet
        open={warning !== null}
        title={warning?.title ?? ''}
        body={warning?.body ?? ''}
        confirmLabel={warning?.confirm ?? ''}
        danger
        onConfirm={() => submission.submit(view.turn, view.outcome, true)}
        onCancel={submission.dismiss}
      />
    </div>
  );
}
