import { content } from '../../content';
import { classes } from '../shared/format';
import { Icon } from '../shared/Icon';
import styles from './AcceptedContextRail.module.scss';

interface HymnRailHeaderProps {
  open: boolean;
  bodyId: string;
  hasMeasures: boolean;
  hymnPlaying: boolean;
  onToggle: () => void;
  onPlayHymn: () => void;
  onStop: () => void;
}

/**
 * The always-visible row. Clicking anywhere left of the divider toggles the
 * fold; the play button never does, so Play hymn stays reachable while closed.
 */
export function HymnRailHeader({
  open,
  bodyId,
  hasMeasures,
  hymnPlaying,
  onToggle,
  onPlayHymn,
  onStop,
}: HymnRailHeaderProps) {
  return (
    <div className={styles.headingRow}>
      {/* Button inside heading — the valid disclosure-heading pattern. */}
      <h2 className={styles.headingWrap}>
        <button
          type="button"
          className={styles.sectionToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          title={open ? content.acceptedRail.hymnHide : content.acceptedRail.hymnShow}
          onClick={onToggle}
        >
          <span className={styles.headingText}>{content.regions.currentHymn}</span>
          <Icon
            name="expand_more"
            className={classes(styles.chevron, open && styles.chevronOpen)}
          />
        </button>
      </h2>
      {hasMeasures ? (
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
  );
}
