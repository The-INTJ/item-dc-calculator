import { content } from '../../content';
import type { HarmonyEvent } from '../../domain/music-types';
import type { AcceptedContext, AppliedFragment } from '../../domain/workbench-state';
import type { TonalContext } from '../../domain/music-types';
import { listAcceptedHarmonyOptions } from '../../fixtures/accepted-harmony-options';
import { toCandidatePathSummary } from '../../state/selectors';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import { PopoverMenu, PopoverMenuItem } from '../shared/PopoverMenu';
import styles from './AcceptedContextRail.module.scss';

interface AcceptedContextRailProps {
  acceptedContext: AcceptedContext;
  appliedFragments: AppliedFragment[];
  tonalContext: TonalContext;
  /** The applied piece loaded for rework, if any. */
  editingAppliedId: string | null;
  /** The applied piece currently sounding during whole-hymn playback. */
  soundingAppliedId: string | null;
  hymnPlaying: boolean;
  /** False when there is no working reading to commit. */
  canAddFragment: boolean;
  onSetAcceptedHarmony: (harmony: HarmonyEvent | null) => void;
  onPlayHymn: () => void;
  onPlayApplied: (appliedId: string) => void;
  onEditApplied: (appliedId: string) => void;
  onAddFragment: () => void;
  onStop: () => void;
}

/**
 * The composition surface: everything applied so far, in order. Each piece can
 * be auditioned or clicked to load it back for rework, and the whole hymn
 * plays end to end.
 */
export function AcceptedContextRail({
  acceptedContext,
  appliedFragments,
  tonalContext,
  editingAppliedId,
  soundingAppliedId,
  hymnPlaying,
  canAddFragment,
  onSetAcceptedHarmony,
  onPlayHymn,
  onPlayApplied,
  onEditApplied,
  onAddFragment,
  onStop,
}: AcceptedContextRailProps) {
  const harmony = acceptedContext.previousHarmony;
  const options = listAcceptedHarmonyOptions(tonalContext);
  return (
    <div>
      <div className={styles.headingRow}>
        <h2 className={styles.heading}>{content.regions.acceptedContext}</h2>
        {appliedFragments.length > 0 ? (
          <button
            type="button"
            className={styles.hymnButton}
            onClick={hymnPlaying ? onStop : onPlayHymn}
          >
            <Icon name={hymnPlaying ? 'stop' : 'play_arrow'} />
            {hymnPlaying ? content.acceptedRail.stopHymn : content.acceptedRail.playHymn}
          </button>
        ) : null}
      </div>
      <div className={styles.rail}>
        {appliedFragments.length > 0 ? (
          <span className={styles.appliedGroup} title={content.acceptedRail.appliedLabel}>
            {appliedFragments.map((applied, index) => (
              <span
                key={applied.id}
                className={classes(
                  styles.appliedPiece,
                  applied.id === editingAppliedId && styles.appliedPieceEditing,
                  applied.id === soundingAppliedId && styles.appliedPieceSounding,
                )}
                data-editing={applied.id === editingAppliedId || undefined}
                data-sounding={applied.id === soundingAppliedId || undefined}
              >
                <button
                  type="button"
                  className={styles.appliedChip}
                  title={content.acceptedRail.editPiece}
                  aria-pressed={applied.id === editingAppliedId}
                  onClick={() => onEditApplied(applied.id)}
                >
                  {index + 1}. {toCandidatePathSummary(applied.candidate).romanNumeralPath}
                </button>
                <button
                  type="button"
                  className={styles.piecePlay}
                  aria-label={`${content.acceptedRail.playPiece}: ${index + 1}`}
                  title={content.acceptedRail.playPiece}
                  onClick={() => onPlayApplied(applied.id)}
                >
                  <Icon name="play_arrow" />
                </button>
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
        <span className={styles.arrowLabel}>
          {editingAppliedId ? content.acceptedRail.editingBadge : content.acceptedRail.arrow}
        </span>
        {/* Commit what's on the workbench and open the next fragment holding
            the chord this one lands on. */}
        <button
          type="button"
          className={styles.addFragment}
          disabled={!canAddFragment}
          title={content.acceptedRail.addFragmentHint}
          onClick={onAddFragment}
        >
          <Icon name="library_add" outlined />
          {content.acceptedRail.addFragment}
        </button>
      </div>
      {editingAppliedId ? (
        <p className={styles.editingHint} role="status">
          {content.acceptedRail.editingHint}
        </p>
      ) : null}
    </div>
  );
}
