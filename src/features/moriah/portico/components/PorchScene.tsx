import type { Ref } from 'react';

import { porticoLabels } from '../content';
import { Lantern } from './Lantern';
import { PorchDoor } from './PorchDoor';
import styles from './PorchScene.module.scss';

/** A one-over-one window beside the door, lit from inside at dusk. */
function PorchWindow({ side }: { side: 'left' | 'right' }) {
  return (
    <span className={`${styles.window} ${styles[side]}`} aria-hidden="true">
      <span className={styles.sash} />
      <span className={styles.sash} />
    </span>
  );
}

/**
 * Moriah's porch wall at dusk, drawn as one elevation: brick, the two lit
 * windows, the door in its casing, the lantern, the floor, the steps with
 * their iron rails, and the walk. The door is a real button — clicking it
 * makes the walk through on its own.
 */
export function PorchScene({
  sceneRef,
  doorwayRef,
  onEnter,
}: {
  sceneRef: Ref<HTMLDivElement>;
  doorwayRef: Ref<HTMLButtonElement>;
  onEnter: () => void;
}) {
  return (
    <div ref={sceneRef} className={styles.scene}>
      <span className={styles.wall} aria-hidden="true" />
      <PorchWindow side="left" />
      <PorchWindow side="right" />
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.casing} aria-hidden="true" />
      <button
        ref={doorwayRef}
        type="button"
        className={styles.doorway}
        aria-label={porticoLabels.door}
        onClick={onEnter}
      >
        <PorchDoor />
      </button>
      <span className={styles.lanternHalo} aria-hidden="true" />
      <Lantern className={styles.lantern} />
      <span className={styles.floor} aria-hidden="true" />
      <span className={styles.steps} aria-hidden="true">
        <span />
        <span />
      </span>
      <span className={styles.rails} aria-hidden="true">
        <span />
        <span />
      </span>
      <span className={styles.walk} aria-hidden="true" />
      <span className={styles.spill} aria-hidden="true" />
    </div>
  );
}
