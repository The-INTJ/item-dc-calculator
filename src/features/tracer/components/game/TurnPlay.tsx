'use client';

import { useState, type ReactNode } from 'react';

import type { RuleSet, Side, SquareName } from '../../engine';
import type { ComposerView } from '../../hooks/composer/composerView';
import { useTurnComposer } from '../../hooks/composer/useTurnComposer';
import { useTurnSubmission, type TurnSender, type TurnWarning } from '../../hooks/composer/useTurnSubmission';
import type { Viewer } from '../../lib/policy';
import { ordinalWord } from '../../lib/presentation/ruleText';
import type { TracerGame } from '../../lib/types';
import { Board } from '../board/Board';
import { boardMarks } from '../board/boardMarks';
import { overlayLines } from '../board/overlayModel';
import { NO_THREATS, threatView } from '../board/threatOverlay';
import { ActionBar } from '../composer/ActionBar';
import { ConfirmSheet } from '../shared/Sheet';
import styles from './Game.module.scss';

function warningCopy(warning: TurnWarning, rules: RuleSet): { title: string; body: string; confirm: string } {
  if (warning === 'king-in-danger') {
    return {
      title: 'Your king can be captured',
      body: 'After this turn your opponent could take your king and win. Submit anyway?',
      confirm: 'Submit anyway',
    };
  }
  return {
    title: 'This step draws the game',
    body: `That is your ${ordinalWord(rules.dodgeDraw)} ${rules.dodgeNeedsThreat ? 'dodge' : 'free king step'} in a row with no capture, which ends the game in a draw.`,
    confirm: 'Draw the game',
  };
}

interface TurnPlayProps {
  game: TracerGame;
  viewer: Viewer;
  orientation: Side;
  showThreats: boolean;
  sendTurn: TurnSender;
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
export function TurnPlay({ game, viewer, orientation, showThreats, sendTurn, ...slots }: TurnPlayProps) {
  const { composer, view, dispatch, tap, finishChart } = useTurnComposer(game, viewer);
  const submission = useTurnSubmission(sendTurn, viewer.actingSide, () => dispatch({ type: 'reset' }));
  const { phase } = submission;
  const busy = phase.kind === 'sending' || phase.kind === 'sent';
  const [probe, setProbe] = useState<SquareName | null>(null);
  const threats = showThreats ? threatView(view.board, orientation, probe) : NO_THREATS;
  const marks = boardMarks(view, view.outcome?.ok ? null : game.lastTurn, threats);
  const lines = [...threats.lines, ...overlayLines(view, composer.selected, game.lastTurn, orientation)];
  const warning = phase.kind === 'confirm' ? warningCopy(phase.warnings[0], game.state.rules) : null;

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
          onTap={(square) => {
            setProbe(square);
            if (!busy) tap(square);
          }}
          onProbe={setProbe}
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
