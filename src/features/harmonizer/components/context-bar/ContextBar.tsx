'use client';

import { useState } from 'react';
import { content } from '../../content';
import type { TonalContext } from '../../domain/music-types';
import type { InstrumentId } from '../../services/instruments';
import type { NotationView } from '../useViewPreference';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import { SamplesMenu } from '../samples/SamplesMenu';
import {
  KeySelector,
  NotationSelector,
  SoundSelector,
  TempoControl,
  TimeSignatureSelector,
} from './SettingsFields';
import styles from './ContextBar.module.scss';

interface ContextBarProps {
  tonalContext: TonalContext;
  tempoBpm: number;
  currentFixtureId: string | null;
  soundId: InstrumentId;
  view: NotationView;
  onTempoChange: (tempoBpm: number) => void;
  onViewChange: (view: NotationView) => void;
  onKeyChange: (context: TonalContext) => void;
  onLoadSample: (fixtureId: string) => void;
  onSoundChange: (id: InstrumentId) => void;
}

export function ContextBar({
  tonalContext,
  tempoBpm,
  currentFixtureId,
  soundId,
  view,
  onTempoChange,
  onViewChange,
  onKeyChange,
  onLoadSample,
  onSoundChange,
}: ContextBarProps) {
  /**
   * Mobile folds the settings away behind this toggle and starts closed —
   * they are set once per hymn and cost a phone screen's worth of room every
   * time you look at the notes. The toggle is CSS-hidden on desktop, where
   * the fields are always shown.
   */
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    // data-open drives BOTH folds on mobile: the fields and the Samples menu,
    // which lives at the bottom of the opened card rather than beside the
    // collapsed one.
    <div className={styles.bar} data-open={settingsOpen || undefined}>
      <button
        type="button"
        className={styles.settingsToggle}
        aria-expanded={settingsOpen}
        title={
          settingsOpen ? content.contextBar.settingsHide : content.contextBar.settingsShow
        }
        onClick={() => setSettingsOpen((open) => !open)}
      >
        <span className={styles.settingsLabel}>
          <Icon name="tune" outlined />
          {content.contextBar.settingsLabel}
        </span>
        <Icon
          name="expand_more"
          className={classes(styles.chevron, settingsOpen && styles.chevronOpen)}
        />
      </button>
      <div className={styles.fields}>
        {/* Key and time signature are the two staff-signature facts; tempo
            and sound are playback qualities. */}
        <KeySelector tonalContext={tonalContext} onKeyChange={onKeyChange} />
        <TimeSignatureSelector />
        <NotationSelector view={view} onViewChange={onViewChange} />
        <TempoControl tempoBpm={tempoBpm} onTempoChange={onTempoChange} />
        <SoundSelector soundId={soundId} onSoundChange={onSoundChange} />
      </div>
      <div className={styles.barEnd}>
        <SamplesMenu currentFixtureId={currentFixtureId} onLoadSample={onLoadSample} />
      </div>
    </div>
  );
}
