'use client';

import { useState } from 'react';
import { content } from '../../content';
import { keySignatureLabel, listMajorKeyContexts, listMinorKeyContexts } from '../../domain/keys';
import type { PhraseIntent, TonalContext } from '../../domain/music-types';
import { INSTRUMENTS, type InstrumentId } from '../../services/instruments';
import { MAX_TEMPO_BPM, MIN_TEMPO_BPM } from '../../state/workbenchReducer';
import { classes, contextLabel } from '../shared/format';
import { SamplesMenu } from '../samples/SamplesMenu';
import styles from './ContextBar.module.scss';

interface ContextBarProps {
  tonalContext: TonalContext;
  phraseIntent: PhraseIntent;
  tempoBpm: number;
  currentFixtureId: string | null;
  soundId: InstrumentId;
  onTempoChange: (tempoBpm: number) => void;
  onKeyChange: (context: TonalContext) => void;
  onIntentChange: (intent: PhraseIntent) => void;
  onLoadSample: (fixtureId: string) => void;
  onSoundChange: (id: InstrumentId) => void;
}

const PHRASE_INTENTS: PhraseIntent[] = ['continue', 'build', 'approach_cadence', 'close'];

/** Spelling-aware identity — Db major and C# major are different options. */
function contextKey(context: TonalContext): string {
  return `${context.tonic.letter}${context.tonic.accidental}:${context.mode}:${context.minorDoSystem ?? ''}`;
}

/** The Key select over every offered key (12 majors + 12 relative minors). */
function KeySelector({
  tonalContext,
  onKeyChange,
}: {
  tonalContext: TonalContext;
  onKeyChange: (context: TonalContext) => void;
}) {
  const majors = listMajorKeyContexts();
  const minors = listMinorKeyContexts();
  const contexts = [...majors, ...minors];
  const currentKey = contextKey(tonalContext);
  const options = (group: readonly TonalContext[]) =>
    group.map((context) => (
      <option key={contextKey(context)} value={contextKey(context)}>
        {contextLabel(context)}
      </option>
    ));
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{content.contextBar.keyLabel}</span>
      <select
        className={styles.select}
        value={currentKey}
        onChange={(event) => {
          const next = contexts.find((context) => contextKey(context) === event.target.value);
          if (next) onKeyChange(next);
        }}
      >
        <optgroup label={content.contextBar.majorKeysHeading}>{options(majors)}</optgroup>
        <optgroup label={content.contextBar.minorKeysHeading}>{options(minors)}</optgroup>
      </select>
      <span className={styles.fieldHint}>{keySignatureLabel(tonalContext)}</span>
    </label>
  );
}

function PhraseIntentControl({
  phraseIntent,
  onIntentChange,
}: {
  phraseIntent: PhraseIntent;
  onIntentChange: (intent: PhraseIntent) => void;
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{content.contextBar.intentLabel}</span>
      <div className={styles.segmented} role="group" aria-label={content.contextBar.intentLabel}>
        {PHRASE_INTENTS.map((intent) => (
          <button
            key={intent}
            type="button"
            aria-pressed={intent === phraseIntent}
            title={content.contextBar.intentDescriptions[intent]}
            className={classes(styles.segment, intent === phraseIntent && styles.segmentActive)}
            onClick={() => onIntentChange(intent)}
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

function SoundSelector({
  soundId,
  onSoundChange,
}: {
  soundId: InstrumentId;
  onSoundChange: (id: InstrumentId) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{content.contextBar.soundLabel}</span>
      <select
        className={styles.select}
        value={soundId}
        onChange={(event) => onSoundChange(event.target.value as InstrumentId)}
      >
        {INSTRUMENTS.map((instrument) => (
          <option
            key={instrument.id}
            value={instrument.id}
            title={instrument.requiresNetwork ? content.contextBar.soundNetworkHint : undefined}
          >
            {instrument.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ContextBar({
  tonalContext,
  phraseIntent,
  tempoBpm,
  currentFixtureId,
  soundId,
  onTempoChange,
  onKeyChange,
  onIntentChange,
  onLoadSample,
  onSoundChange,
}: ContextBarProps) {
  return (
    <div className={styles.bar}>
      <KeySelector tonalContext={tonalContext} onKeyChange={onKeyChange} />
      <PhraseIntentControl phraseIntent={phraseIntent} onIntentChange={onIntentChange} />
      <TempoControl tempoBpm={tempoBpm} onTempoChange={onTempoChange} />
      <SoundSelector soundId={soundId} onSoundChange={onSoundChange} />
      <div className={styles.barEnd}>
        <SamplesMenu currentFixtureId={currentFixtureId} onLoadSample={onLoadSample} />
      </div>
    </div>
  );
}
