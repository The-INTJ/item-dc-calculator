'use client';

import { useState } from 'react';

import { otherSide } from '../../engine';
import { useLocalGame } from '../../hooks/useLocalGame';
import { useStartLocalGame } from '../../hooks/useStartLocalGame';
import { LOCAL_UID } from '../../lib/local/localGame';
import { deriveViewer } from '../../lib/policy';
import { GameHeader } from '../game/GameHeader';
import { PlayerBar } from '../game/PlayerBar';
import { StyleChip } from '../game/StyleChip';
import { TurnPlay } from '../game/TurnPlay';
import { useBoardDisplay } from '../game/useBoardDisplay';
import { GamePanels, type PanelTab } from '../panels/GamePanels';
import { TurnList } from '../panels/TurnHistory';
import { LocalMenu } from './LocalMenu';
import { LocalStatus } from './LocalStatus';
import gameStyles from '../game/Game.module.scss';
import statusStyles from '../game/Status.module.scss';

function MissingLocalGame({ onNewGame }: { onNewGame: () => void }) {
  return (
    <main className={gameStyles.page}>
      <GameHeader menu={null} />
      <div className={statusStyles.card}>
        <p>This local game is not on this device. Local games are saved in the browser that started them.</p>
        <button type="button" className={statusStyles.primary} onClick={onNewGame}>
          Start a new local game
        </button>
      </div>
    </main>
  );
}

/** Both sides on one device: the engine runs here, nothing goes to a server. */
export function LocalGameView({ localId }: { localId: string }) {
  const local = useLocalGame(localId);
  const startLocalGame = useStartLocalGame();
  const [tab, setTab] = useState<PanelTab>('piece');
  const game = local.game;
  const viewer = game ? deriveViewer(game, LOCAL_UID) : null;
  const display = useBoardDisplay(viewer?.orientation ?? 'w');

  if (local.record === undefined) return <main className={gameStyles.page} aria-busy="true" />;
  if (!game || !viewer || !local.record) return <MissingLocalGame onNewGame={() => startLocalGame()} />;
  const turns = local.record.turns;
  const sameRules = () => startLocalGame({ styleId: game.style.id, rules: game.state.rules });
  const openRules = () => {
    setTab('rules');
    document.getElementById('tracer-tab-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const menu = (
    <LocalMenu
      game={game}
      canUndo={turns.length > 0 || game.status === 'finished'}
      onUndo={local.undo}
      onDraw={local.draw}
      onResign={local.resign}
      onNewGame={sameRules}
    />
  );

  return (
    <main className={gameStyles.page}>
      <GameHeader menu={menu} chip={<StyleChip game={game} onOpen={openRules} />} />
      <TurnPlay
        key={game.state.ply}
        game={game}
        viewer={viewer}
        orientation={display.orientation}
        showThreats={display.showThreats}
        sendTurn={local.submitTurn}
        topBar={<PlayerBar game={game} side={otherSide(display.orientation)} isViewer={false} />}
        bottomBar={<PlayerBar game={game} side={display.orientation} isViewer={false} />}
        toolbar={display.toolbar}
        status={<LocalStatus game={game} onUndo={local.undo} onNewGame={sameRules} />}
        panels={(view) => (
          <GamePanels tab={tab} onTab={setTab} view={view} game={game} ownSide={display.orientation} history={<TurnList game={game} turns={turns} />} />
        )}
      />
    </main>
  );
}
