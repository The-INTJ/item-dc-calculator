'use client';

import type { ReactNode } from 'react';

import type { RuleSet, Side } from '../../engine';
import type { ComposerView } from '../../hooks/composer/composerView';
import type { TracerGame } from '../../lib/types';
import { howToPlay } from './content';
import { KingPatterns } from './KingPatterns';
import { PieceInspector } from './PieceInspector';
import styles from './Panels.module.scss';

export type PanelTab = 'piece' | 'kings' | 'history' | 'rules';

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'piece', label: 'Piece' },
  { id: 'kings', label: 'Kings' },
  { id: 'history', label: 'Moves' },
  { id: 'rules', label: 'Rules' },
];

/** How to play under `rules`. */
export function RulesList({ rules }: { rules: RuleSet }) {
  return (
    <div className={styles.rules}>
      {howToPlay(rules).map((section) => (
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
  /** The move list for this kind of game — only mounted while its tab is open. */
  history: ReactNode;
}

export function GamePanels({ tab, onTab, view, game, ownSide, history }: GamePanelsProps) {
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
        {tab === 'kings' && <KingPatterns game={game} firstSide={ownSide} />}
        {tab === 'history' && history}
        {tab === 'rules' && <RulesList rules={game.state.rules} />}
      </div>
    </section>
  );
}
