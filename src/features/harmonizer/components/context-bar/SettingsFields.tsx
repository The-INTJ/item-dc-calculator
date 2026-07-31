'use client';

import { useState } from 'react';
import { content } from '../../content';
import { keySignatureLabel, listMajorKeyContexts, listMinorKeyContexts } from '../../domain/keys';
import { TIME_SIGNATURE_LABEL } from '../../domain/timing';
import type { TonalContext } from '../../domain/music-types';
import { INSTRUMENTS, type InstrumentId } from '../../services/instruments';
import type { TermId } from '../../knowledge/glossary';
import { MAX_TEMPO_BPM, MIN_TEMPO_BPM } from '../../state/workbenchReducer';
import { NOTATION_VIEWS, type NotationView } from '../useViewPreference';
import { contextLabel } from '../shared/format';
import { Term } from '../shared/Term';
import styles from './ContextBar.module.scss';

/** Spelling-aware identity — Db major and C# major are different options. */
function contextKey(context: TonalContext): string {
  return `${context.tonic.letter}${context.tonic.accidental}:${context.mode}:${context.minorDoSystem ?? ''}`;
}

/**
 * Every settings label teaches itself (Drew, 2026-07-30) — hover or click the
 * word and the glossary explains it. The field is a plain div, not a <label>:
 * a label would forward the Term button's click on to the control it wraps.
 */
function FieldLabel({ termId, children }: { termId: TermId; children: string }) {
  return (
    <Term termId={termId} variant="chip" className={styles.fieldLabel}>
      {children}
    </Term>
  );
}

/** The Key select over every offered key (12 majors + 12 relative minors). */
export function KeySelector({
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
    <div className={styles.field}>
      <FieldLabel termId="key">{content.contextBar.keyLabel}</FieldLabel>
      <select
        className={styles.select}
        aria-label={content.contextBar.keyLabel}
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
    </div>
  );
}

/**
 * SEAT ONLY (2026-07-30): the meter is fixed 4/4 and this select changes
 * nothing — it names the assumption where a user would look for it. When time
 * signatures become real, this select gains options and dispatches a
 * SET_TIME_SIGNATURE action; the full sweep that must accompany that is
 * enumerated in the meter ledger at the head of domain/timing.ts. The select
 * is deliberately enabled (uncontrolled, single option) so it reads and
 * announces as a normal setting, not a broken one.
 */
export function TimeSignatureSelector() {
  return (
    <div className={styles.field}>
      <FieldLabel termId="time-signature">{content.contextBar.timeSignatureLabel}</FieldLabel>
      <select className={styles.select} aria-label={content.contextBar.timeSignatureLabel}>
        <option>{TIME_SIGNATURE_LABEL}</option>
      </select>
    </div>
  );
}

/**
 * How the current measure is drawn. The staff says more at a glance; the lanes
 * are the surface you edit on, so keeping both is a working arrangement rather
 * than an either/or — which is why "Both" is an option and not a compromise.
 */
export function NotationSelector({
  view,
  onViewChange,
}: {
  view: NotationView;
  onViewChange: (view: NotationView) => void;
}) {
  return (
    <div className={styles.field}>
      <FieldLabel termId="shape-notes">{content.contextBar.notationLabel}</FieldLabel>
      <select
        className={styles.select}
        aria-label={content.contextBar.notationLabel}
        value={view}
        onChange={(event) => onViewChange(event.target.value as NotationView)}
      >
        {NOTATION_VIEWS.map((option) => (
          <option key={option} value={option}>
            {content.contextBar.notationOptions[option]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TempoControl({
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
    <div className={styles.field}>
      <FieldLabel termId="tempo">{content.contextBar.tempoLabel}</FieldLabel>
      <span className={styles.tempoWrap}>
        <input
          type="number"
          className={styles.tempoInput}
          aria-label={content.contextBar.tempoLabel}
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
    </div>
  );
}

export function SoundSelector({
  soundId,
  onSoundChange,
}: {
  soundId: InstrumentId;
  onSoundChange: (id: InstrumentId) => void;
}) {
  return (
    <div className={styles.field}>
      <FieldLabel termId="sound">{content.contextBar.soundLabel}</FieldLabel>
      <select
        className={styles.select}
        aria-label={content.contextBar.soundLabel}
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
    </div>
  );
}
