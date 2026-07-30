import { useId, useState } from 'react';
import { content } from '../../content';
import type { AppliedFragment } from '../../domain/workbench-state';
import { toCandidatePathSummary } from '../../state/selectors';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import styles from './AcceptedContextRail.module.scss';

interface AcceptedContextRailProps {
  appliedFragments: AppliedFragment[];
  /** The measure loaded in the editor — its pill renders selected. */
  selectedMeasureId: string | null;
  /** The measure currently sounding during whole-hymn playback. */
  soundingAppliedId: string | null;
  hymnPlaying: boolean;
  /** False when the hymn has no measure to continue from. */
  canAddMeasure: boolean;
  onPlayHymn: () => void;
  onPlayApplied: (appliedId: string) => void;
  onSelectMeasure: (appliedId: string) => void;
  onAddMeasure: () => void;
  onStop: () => void;
}

/**
 * The hymn: every measure in order, one always selected. Starts folded — the
 * header row keeps Play hymn reachable while closed; opening it shows the
 * measure pills (the selected one boxy and green, mirroring the workspace
 * live via the reducer's write-through) and the Add-measure button. Clicking
 * anywhere left of the divider bar toggles the fold; the play button never
 * toggles.
 */
export function AcceptedContextRail({
  appliedFragments,
  selectedMeasureId,
  soundingAppliedId,
  hymnPlaying,
  canAddMeasure,
  onPlayHymn,
  onPlayApplied,
  onSelectMeasure,
  onAddMeasure,
  onStop,
}: AcceptedContextRailProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  return (
    <div className={styles.root} data-open={open || undefined}>
      <div className={styles.headingRow}>
        {/* Button inside heading — the valid disclosure-heading pattern. */}
        <h2 className={styles.headingWrap}>
          <button
            type="button"
            className={styles.sectionToggle}
            aria-expanded={open}
            aria-controls={bodyId}
            title={open ? content.acceptedRail.hymnHide : content.acceptedRail.hymnShow}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={styles.headingText}>{content.regions.currentHymn}</span>
            <Icon
              name="expand_more"
              className={classes(styles.chevron, open && styles.chevronOpen)}
            />
          </button>
        </h2>
        {appliedFragments.length > 0 ? (
          <>
            <span className={styles.headerDivider} aria-hidden="true" />
            <button
              type="button"
              className={styles.hymnButton}
              onClick={hymnPlaying ? onStop : onPlayHymn}
            >
              <Icon name={hymnPlaying ? 'stop' : 'play_arrow'} />
              {hymnPlaying ? content.acceptedRail.stopHymn : content.acceptedRail.playHymn}
            </button>
          </>
        ) : null}
      </div>
      {open ? (
        <div className={styles.rail} id={bodyId}>
          {appliedFragments.length > 0 ? (
            <span className={styles.appliedGroup}>
              {appliedFragments.map((applied, index) => (
                <span
                  key={applied.id}
                  className={classes(
                    styles.appliedPiece,
                    applied.id === selectedMeasureId && styles.appliedPieceSelected,
                    applied.id === soundingAppliedId && styles.appliedPieceSounding,
                  )}
                  data-selected={applied.id === selectedMeasureId || undefined}
                  data-sounding={applied.id === soundingAppliedId || undefined}
                >
                  <button
                    type="button"
                    className={styles.appliedChip}
                    title={content.acceptedRail.editPiece}
                    aria-pressed={applied.id === selectedMeasureId}
                    onClick={() => onSelectMeasure(applied.id)}
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
          <button
            type="button"
            className={styles.addMeasure}
            disabled={!canAddMeasure}
            title={content.acceptedRail.addMeasureHint}
            onClick={onAddMeasure}
          >
            <Icon name="library_add" outlined />
            {content.acceptedRail.addMeasure}
          </button>
        </div>
      ) : null}
    </div>
  );
}
