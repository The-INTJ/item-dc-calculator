import styles from './Columns.module.scss';

/**
 * One of the porch's square columns, as on the building: a capped top of two
 * steps, a plain square shaft, and a plinth base.
 */
function Column({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`${styles.column} ${styles[side]}`}>
      <span className={styles.abacus} />
      <span className={styles.neck} />
      <span className={styles.shaft} />
      <span className={styles.torus} />
      <span className={styles.plinth} />
    </div>
  );
}

/**
 * The two columns that stand along both sides of every page. Pure CSS: a
 * sticky layer inside <main> keeps them in view from the architrave down to
 * the bottom of the window, and at the end of the page they come to rest on
 * the porch floor — no scroll listener involved.
 */
export function Columns() {
  return (
    <div className={styles.columns} aria-hidden="true">
      <div className={styles.stick}>
        <Column side="left" />
        <Column side="right" />
      </div>
    </div>
  );
}
