'use client';

import type { Side } from '../../engine';
import type { ComposerView } from '../../hooks/composer/composerView';
import type { TracerGame } from '../../lib/types';
import { RULES } from './content';
import { KingLibrary } from './KingLibrary';
import { PieceInspector } from './PieceInspector';
import { TurnHistory } from './TurnHistory';
import styles from './Panels.module.scss';

export type PanelTab = 'piece' | 'library' | 'history' | 'rules';

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'piece', label: 'Piece' },
  { id: 'library', label: 'Libraries' },
  { id: 'history', label: 'Moves' },
  { id: 'rules', label: 'Rules' },
];

export function RulesList() {
  return (
    <div className={styles.rules}>
      {RULES.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          <ul>
            {section.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

interface GamePanelsProps {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  view: ComposerView;
  game: TracerGame;
  ownSide: Side;
}

export function GamePanels({ tab, onTab, view, game, ownSide }: GamePanelsProps) {
  return (
    <section className={styles.panels} aria-label="Game details">
      <div className={styles.tabs} role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tracer-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls="tracer-tab-panel"
            className={tab === item.id ? styles.tabOn : styles.tab}
            onClick={() => onTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.panelBody} role="tabpanel" id="tracer-tab-panel" aria-labelledby={`tracer-tab-${tab}`}>
        {tab === 'piece' && <PieceInspector view={view} game={game} />}
        {tab === 'library' && <KingLibrary game={game} firstSide={ownSide} />}
        {tab === 'history' && <TurnHistory game={game} />}
        {tab === 'rules' && <RulesList />}
      </div>
    </section>
  );
}
