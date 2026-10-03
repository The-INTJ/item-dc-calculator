'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { BackToExperiments } from '@/components/ui/BackToExperiments';

import { otherSide } from '../../engine';
import { useGameCommands } from '../../hooks/useGameCommands';
import { useGamePageEffects, useNow } from '../../hooks/useGamePageEffects';
import { useViewer } from '../../hooks/usePlayerIdentity';
import { useTracerGame } from '../../hooks/useTracerGame';
import type { TracerGame } from '../../lib/types';
import { GamePanels, type PanelTab } from '../panels/GamePanels';
import { GameMenu } from './GameMenu';
import { BoardToolbar, PlayerBar } from './PlayerBar';
import { StatusPanel } from './StatusPanel';
import { TurnPlay } from './TurnPlay';
import styles from './Game.module.scss';

function MissingGame() {
  return (
    <main className={styles.page}>
      <p>This game no longer exists.</p>
      <Link href="/tracer">Start a new game</Link>
    </main>
  );
}

function GameHeader({ menu }: { menu: ReactNode }) {
  return (
    <header className={styles.header}>
      <BackToExperiments className={styles.backLink} />
      <Link href="/tracer" className={styles.wordmark}>
        Tracer
      </Link>
      {menu}
    </header>
  );
}

/** The whole game page: live game, identity, layout. */
export function TracerGameView({ initialGame }: { initialGame: TracerGame }) {
  const { game, live, missing } = useTracerGame(initialGame.id, initialGame);
  const { viewer, uid, defaultName, ensurePlayer, loading } = useViewer(game);
  const commands = useGameCommands(game.id);
  const now = useNow();
  const [tab, setTab] = useState<PanelTab>('piece');
  const [flipped, setFlipped] = useState(false);
  const [showThreats, setShowThreats] = useState(false);
  useGamePageEffects(game, viewer.canMove);

  const orientation = flipped ? otherSide(viewer.orientation) : viewer.orientation;
  const isViewer = (side: 'w' | 'b') => uid !== null && game.seats[side].uid === uid;

  async function join(name: string) {
    const signedIn = await ensurePlayer(name);
    if (signedIn.ok) await commands.join(name);
    else commands.reportError(signedIn.message);
  }

  if (missing) return <MissingGame />;

  return (
    <main className={styles.page}>
      <GameHeader menu={<GameMenu game={game} viewer={viewer} commands={commands} now={now} />} />
      <TurnPlay
        key={game.state.ply}
        game={game}
        viewer={viewer}
        orientation={orientation}
        showThreats={showThreats}
        topBar={<PlayerBar game={game} side={otherSide(orientation)} isViewer={isViewer(otherSide(orientation))} />}
        bottomBar={<PlayerBar game={game} side={orientation} isViewer={isViewer(orientation)} />}
        toolbar={
          <BoardToolbar
            showThreats={showThreats}
            onToggleThreats={() => setShowThreats(!showThreats)}
            onFlip={() => setFlipped(!flipped)}
          />
        }
        status={
          <StatusPanel
            game={game}
            viewer={viewer}
            live={live}
            identifying={loading}
            defaultName={defaultName}
            commands={commands}
            onJoin={(name) => void join(name)}
          />
        }
        panels={(view) => <GamePanels tab={tab} onTab={setTab} view={view} game={game} ownSide={orientation} />}
      />
    </main>
  );
}
