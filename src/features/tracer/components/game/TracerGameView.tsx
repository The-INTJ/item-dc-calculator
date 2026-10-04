'use client';

import Link from 'next/link';
import { useState } from 'react';

import { otherSide, type Side } from '../../engine';
import { useGameCommands } from '../../hooks/useGameCommands';
import { useGamePageEffects, useNow } from '../../hooks/useGamePageEffects';
import { useViewer } from '../../hooks/usePlayerIdentity';
import { useTracerGame } from '../../hooks/useTracerGame';
import { tracerApi } from '../../lib/api/tracerApi';
import type { TracerGame } from '../../lib/types';
import { GamePanels, type PanelTab } from '../panels/GamePanels';
import { OnlineTurnHistory } from '../panels/TurnHistory';
import { GameHeader } from './GameHeader';
import { GameMenu } from './GameMenu';
import { PlayerBar } from './PlayerBar';
import { StatusPanel } from './StatusPanel';
import { StyleChip } from './StyleChip';
import { TurnPlay } from './TurnPlay';
import { useBoardDisplay } from './useBoardDisplay';
import styles from './Game.module.scss';

function MissingGame() {
  return (
    <main className={styles.page}>
      <p>This game no longer exists.</p>
      <Link href="/tracer">Start a new game</Link>
    </main>
  );
}

/** An online game: live from Firestore, every turn through the server. */
export function TracerGameView({ initialGame }: { initialGame: TracerGame }) {
  const { game, live, missing } = useTracerGame(initialGame.id, initialGame);
  const { viewer, uid, defaultName, ensurePlayer, loading } = useViewer(game);
  const commands = useGameCommands(game.id);
  const now = useNow();
  const [tab, setTab] = useState<PanelTab>('piece');
  const { orientation, showThreats, toolbar } = useBoardDisplay(viewer.orientation);
  useGamePageEffects(game, viewer.canMove);
  const isViewer = (side: Side) => uid !== null && game.seats[side].uid === uid;

  async function join(name: string) {
    const signedIn = await ensurePlayer(name);
    if (signedIn.ok) await commands.join(name);
    else commands.reportError(signedIn.message);
  }

  if (missing) return <MissingGame />;
  const openRules = () => {
    setTab('rules');
    document.getElementById('tracer-tab-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <main className={styles.page}>
      <GameHeader
        menu={<GameMenu game={game} viewer={viewer} commands={commands} now={now} />}
        chip={<StyleChip game={game} onOpen={openRules} />}
      />
      <TurnPlay
        key={game.state.ply}
        game={game}
        viewer={viewer}
        orientation={orientation}
        showThreats={showThreats}
        sendTurn={(input) => tracerApi.submitTurn(game.id, input)}
        topBar={<PlayerBar game={game} side={otherSide(orientation)} isViewer={isViewer(otherSide(orientation))} />}
        bottomBar={<PlayerBar game={game} side={orientation} isViewer={isViewer(orientation)} />}
        toolbar={toolbar}
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
        panels={(view) => (
          <GamePanels
            tab={tab}
            onTab={setTab}
            view={view}
            game={game}
            ownSide={orientation}
            history={<OnlineTurnHistory game={game} />}
          />
        )}
      />
    </main>
  );
}
