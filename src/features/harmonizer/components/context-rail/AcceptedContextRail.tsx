import { content } from '../../content';
import type { HarmonyEvent } from '../../domain/music-types';
import type { AcceptedContext, AppliedFragment } from '../../domain/workbench-state';
import type { TonalContext } from '../../domain/music-types';
import { listAcceptedHarmonyOptions } from '../../fixtures/accepted-harmony-options';
import { toCandidatePathSummary } from '../../state/selectors';
import { PopoverMenu, PopoverMenuItem } from '../shared/PopoverMenu';
import styles from './AcceptedContextRail.module.scss';

interface AcceptedContextRailProps {
  acceptedContext: AcceptedContext;
  appliedFragments: AppliedFragment[];
  tonalContext: TonalContext;
  onSetAcceptedHarmony: (harmony: HarmonyEvent | null) => void;
}

export function AcceptedContextRail({
  acceptedContext,
  appliedFragments,
  tonalContext,
  onSetAcceptedHarmony,
}: AcceptedContextRailProps) {
  const harmony = acceptedContext.previousHarmony;
  const options = listAcceptedHarmonyOptions(tonalContext);
  return (
    <div>
      <h2 className={styles.heading}>{content.regions.acceptedContext}</h2>
      <div className={styles.rail}>
        {appliedFragments.length > 0 ? (
          <span className={styles.appliedGroup} title={content.acceptedRail.appliedLabel}>
            {appliedFragments.map((applied, index) => (
              <span key={applied.id} className={styles.appliedChip}>
                {index + 1}. {toCandidatePathSummary(applied.candidate).romanNumeralPath}
              </span>
            ))}
          </span>
        ) : null}
        <PopoverMenu
          triggerClassName={styles.chip}
          heading={content.acceptedRail.editHeading}
          triggerLabel={
            harmony ? (
              <>
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
              </>
            ) : (
              <span className={styles.none}>{content.acceptedRail.none}</span>
            )
          }
        >
          {(close) => (
            <>
              {options.map((option) => (
                <PopoverMenuItem
                  key={option.id}
                  active={
                    harmony !== null &&
                    option.analysis.romanNumeral === harmony.analysis.romanNumeral &&
                    option.inversion === harmony.inversion
                  }
                  onSelect={() => {
                    close();
                    onSetAcceptedHarmony(option);
                  }}
                >
                  {option.analysis.romanNumeral} · {option.displaySymbol}
                </PopoverMenuItem>
              ))}
              <PopoverMenuItem
                active={harmony === null}
                onSelect={() => {
                  close();
                  onSetAcceptedHarmony(null);
                }}
              >
                {content.acceptedRail.none}
              </PopoverMenuItem>
            </>
          )}
        </PopoverMenu>
        <span className={styles.arrow} aria-hidden="true" />
        <span className={styles.arrowLabel}>{content.acceptedRail.arrow}</span>
      </div>
    </div>
  );
}
