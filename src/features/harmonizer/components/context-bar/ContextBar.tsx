'use client';

import { useState } from 'react';
import { content } from '../../content';
import type { PhraseIntent, TonalContext } from '../../domain/music-types';
import { MAX_TEMPO_BPM, MIN_TEMPO_BPM } from '../../state/workbenchReducer';
import { classes } from '../shared/format';
import styles from './ContextBar.module.scss';

interface ContextBarProps {
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  tempoBpm: number;
  onTempoChange: (tempoBpm: number) => void;
}

const PHRASE_INTENTS: PhraseIntent[] = ['continue', 'build', 'approach_cadence', 'close'];

function keyDisplay(tonalContext: TonalContext): string {
  return `${tonalContext.tonic.letter}${content.accidentalLabels[tonalContext.tonic.accidental]}`;
}

/** Inert until the stale-suggestions milestone (M4): key, mode, intent. Tempo is live. */
function KeySelector({ tonalContext }: { tonalContext: TonalContext }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{content.contextBar.keyLabel}</span>
      <select className={styles.select} disabled title={content.comingSoon}>
        <option>{keyDisplay(tonalContext)}</option>
      </select>
    </label>
  );
}

function ModeSelector({ tonalContext }: { tonalContext: TonalContext }) {
  const label = content.contextBar.modeLabels[tonalContext.mode];
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{content.contextBar.modeLabel}</span>
      <select className={styles.select} disabled title={content.comingSoon}>
        <option>{label}</option>
      </select>
    </label>
  );
}

function PhraseIntentControl({ phraseIntent }: { phraseIntent: PhraseIntent }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{content.contextBar.intentLabel}</span>
      <div className={styles.segmented} role="group" aria-label={content.contextBar.intentLabel}>
        {PHRASE_INTENTS.map((intent) => (
          <button
            key={intent}
            type="button"
            disabled
            aria-pressed={intent === phraseIntent}
            title={content.contextBar.intentDescriptions[intent]}
            className={classes(styles.segment, intent === phraseIntent && styles.segmentActive)}
          >
            {content.contextBar.intentOptions[intent]}
          </button>
        ))}
      </div>
    </div>
  );
}

function TempoControl({
  tempoBpm,
  onTempoChange,
}: {
  tempoBpm: number;
  onTempoChange: (tempoBpm: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft === null) return;
    const value = Number(draft);
    if (!Number.isNaN(value) && draft.trim() !== '') {
      onTempoChange(value);
    }
    setDraft(null);
  }

  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{content.contextBar.tempoLabel}</span>
      <span className={styles.tempoWrap}>
        <input
          type="number"
          className={styles.tempoInput}
          min={MIN_TEMPO_BPM}
          max={MAX_TEMPO_BPM}
          value={draft ?? String(tempoBpm)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
          }}
        />
        <span className={styles.fieldUnit}>{content.contextBar.tempoUnit}</span>
      </span>
    </label>
  );
}

export function ContextBar({ tonalContext, phraseIntent, tempoBpm, onTempoChange }: ContextBarProps) {
  return (
    <div className={styles.bar}>
      <KeySelector tonalContext={tonalContext} />
      <ModeSelector tonalContext={tonalContext} />
      <PhraseIntentControl phraseIntent={phraseIntent} />
      <TempoControl tempoBpm={tempoBpm} onTempoChange={onTempoChange} />
      <button type="button" className={styles.playAccepted} disabled title={content.comingSoon}>
        ▶ {content.contextBar.playAccepted}
      </button>
    </div>
  );
}
