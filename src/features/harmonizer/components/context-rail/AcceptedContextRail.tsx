import { content } from '../../content';
import type { AcceptedContext } from '../../domain/workbench-state';
import styles from './AcceptedContextRail.module.scss';

interface AcceptedContextRailProps {
  acceptedContext: AcceptedContext;
}

export function AcceptedContextRail({ acceptedContext }: AcceptedContextRailProps) {
  const harmony = acceptedContext.previousHarmony;
  return (
    <div>
      <h2 className={styles.heading}>{content.regions.acceptedContext}</h2>
      <div className={styles.rail}>
        {harmony ? (
          <span className={styles.chip} title={content.comingSoon}>
            <span className={styles.chipNumeral}>{harmony.analysis.romanNumeral}</span>
            <span className={styles.chipDivider} aria-hidden="true">
              ·
            </span>
            <span>
              {harmony.chord.root.letter}
              {content.accidentalLabels[harmony.chord.root.accidental]}{' '}
              {content.chordQualityLabels[harmony.chord.quality]}
            </span>
            <span className={styles.chipDivider} aria-hidden="true">
              ·
            </span>
            <span>{content.inversionLabels[harmony.inversion]}</span>
            {harmony.inversion === 0 ? (
              <>
                <span className={styles.chipDivider} aria-hidden="true">
                  ·
                </span>
                <span>
                  {content.acceptedRail.bassPrefix}{' '}
                  <span className={styles.chipSolfege}>{harmony.analysis.scaleDegreeRoot.syllable}</span>
                </span>
              </>
            ) : null}
          </span>
        ) : (
          <span className={styles.none}>—</span>
        )}
        <span className={styles.arrow} aria-hidden="true" />
        <span className={styles.arrowLabel}>{content.acceptedRail.arrow}</span>
      </div>
    </div>
  );
}
