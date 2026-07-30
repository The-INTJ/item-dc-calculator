import type { HarmonyEvent } from '../../domain/music-types';
import { toTimelineSpan } from '../../domain/timing';
import { numeralTermId } from '../../knowledge/glossary';
import { classes } from '../shared/format';
import { Term } from '../shared/Term';
import { isUnitActive } from '../shared/timeGrid';
import styles from './ChordStrip.module.scss';

interface ChordStripProps {
  harmonyEvents: HarmonyEvent[];
  activeUnit: number | null;
  gridUnits: number;
  /** Computed (naive-generator) candidates render with a dashed, tinted strip. */
  computed?: boolean;
}

/**
 * The chord display: one continuous strip spanning the time tracks, split by
 * internal vertical bars where the harmony changes (Drew's reimagined
 * boundary visual — the bars are where the through-lines land). Purely
 * derived from the selected reading.
 *
 * Each segment reads solfège-first: the root syllable, then the roman numeral
 * (a hoverable glossary Term), then the letter symbol.
 */
export function ChordStrip({ harmonyEvents, activeUnit, gridUnits, computed }: ChordStripProps) {
  if (harmonyEvents.length === 0 || gridUnits === 0) return null;
  return (
    <div
      className={classes(styles.strip, computed && styles.stripComputed)}
      style={{ gridColumn: '2 / -1' }}
    >
      <div className={styles.segments}>
        {harmonyEvents.map((event, index) => {
          const span = toTimelineSpan(event.start, event.duration);
          const active = isUnitActive(span, activeUnit);
          return (
            <div
              key={event.id}
              className={classes(
                styles.segment,
                index > 0 && styles.segmentDivided,
                active && styles.segmentActive,
              )}
              style={{ gridColumn: `${span.startUnit} / span ${span.spanUnits}` }}
              data-active={active || undefined}
            >
              <span className={styles.rootSyllable}>
                {event.analysis.scaleDegreeRoot.syllable}
              </span>
              <Term termId={numeralTermId} variant="chip" className={styles.numeral}>
                {event.analysis.romanNumeral}
              </Term>
              <span className={styles.symbol}>{event.displaySymbol}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
