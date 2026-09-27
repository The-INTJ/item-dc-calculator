import styles from './PorchDoor.module.scss';

/** Six raised panels a leaf: a short pair, then two tall pairs — as on Moriah's doors. */
const PANEL_COUNT = 6;

function Leaf({ side }: { side: 'left' | 'right' }) {
  return (
    <span className={`${styles.leaf} ${styles[side]}`}>
      {Array.from({ length: PANEL_COUNT }, (_, index) => (
        <span key={index} className={styles.panel} />
      ))}
      {side === 'right' ? (
        <>
          <span className={styles.deadbolt} />
          <span className={styles.knob} />
        </>
      ) : null}
    </span>
  );
}

/**
 * Moriah's white double doors, hinged at their outer edges, with the light of
 * the room behind them. The leaves turn on `--open` (scroll) plus `--ajar`
 * (hover), so they can be drawn open by either without fighting each other.
 */
export function PorchDoor() {
  return (
    <span className={styles.door} aria-hidden="true">
      <span className={styles.interior} />
      <span className={styles.leaves}>
        <Leaf side="left" />
        <Leaf side="right" />
      </span>
    </span>
  );
}
