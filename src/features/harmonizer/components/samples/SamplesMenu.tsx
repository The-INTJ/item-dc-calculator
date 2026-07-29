import { content } from '../../content';
import type { TonalContext } from '../../domain/music-types';
import { listFixtureSummaries } from '../../fixtures/registry';
import { PopoverMenu, PopoverMenuItem } from '../shared/PopoverMenu';
import styles from '../context-bar/ContextBar.module.scss';

export function contextLabel(context: TonalContext): string {
  const accidental = content.accidentalLabels[context.tonic.accidental];
  const quality = context.mode === 'major' ? 'major' : 'minor';
  return `${context.tonic.letter}${accidental} ${quality}`;
}

interface SamplesMenuProps {
  currentFixtureId: string | null;
  onLoadSample: (fixtureId: string) => void;
}

/** Every authored fixture family, one click away. */
export function SamplesMenu({ currentFixtureId, onLoadSample }: SamplesMenuProps) {
  return (
    <PopoverMenu
      triggerLabel={content.contextBar.samplesLabel}
      triggerClassName={styles.samplesTrigger}
      heading={content.contextBar.samplesHeading}
      align="right"
    >
      {(close) =>
        listFixtureSummaries().map((summary) => (
          <PopoverMenuItem
            key={summary.id}
            active={summary.id === currentFixtureId}
            onSelect={() => {
              close();
              onLoadSample(summary.id);
            }}
          >
            {summary.name} · {contextLabel(summary.tonalContext)}
          </PopoverMenuItem>
        ))
      }
    </PopoverMenu>
  );
}
