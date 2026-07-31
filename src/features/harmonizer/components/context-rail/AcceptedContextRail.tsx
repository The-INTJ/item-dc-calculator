import { useId, useState } from 'react';
import { content } from '../../content';
import type { AppliedFragment } from '../../domain/workbench-state';
import { Icon } from '../shared/Icon';
import { HymnRailHeader } from './HymnRailHeader';
import { MeasurePill } from './MeasurePill';
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
 * live via the reducer's write-through) and the Add-measure button.
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
      <HymnRailHeader
        open={open}
        bodyId={bodyId}
        hasMeasures={appliedFragments.length > 0}
        hymnPlaying={hymnPlaying}
        onToggle={() => setOpen((value) => !value)}
        onPlayHymn={onPlayHymn}
        onStop={onStop}
      />
      {open ? (
        <div className={styles.rail} id={bodyId}>
          {appliedFragments.length > 0 ? (
            <span className={styles.appliedGroup}>
              {appliedFragments.map((applied, index) => (
                <MeasurePill
                  key={applied.id}
                  applied={applied}
                  position={index + 1}
                  selected={applied.id === selectedMeasureId}
                  sounding={applied.id === soundingAppliedId}
                  onSelect={() => onSelectMeasure(applied.id)}
                  onPlay={() => onPlayApplied(applied.id)}
                />
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
