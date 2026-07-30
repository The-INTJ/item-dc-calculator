import { content } from '../../content';
import { listFixtureSummaries } from '../../fixtures/registry';
import { contextLabel } from '../shared/format';
import { PopoverMenu, PopoverMenuItem } from '../shared/PopoverMenu';
import styles from '../context-bar/ContextBar.module.scss';

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
