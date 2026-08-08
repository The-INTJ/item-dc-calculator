'use client';

import Link from 'next/link';

import { AdminLog } from './AdminLog';
import styles from './DonutsAdmin.module.scss';
import { OverridesEditor } from './OverridesEditor';
import { PeopleEditor } from './PeopleEditor';
import { RotationEditor } from './RotationEditor';
import { ScheduleOutlook } from './ScheduleOutlook';
import { useDonutsAdmin } from './useDonutsAdmin';

/**
 * Unauthenticated on purpose — the path is unlisted rather than gated, which is
 * what the group asked for. Nothing here is sensitive beyond first names.
 */
export function DonutsAdminView() {
  const { board, loading, error, reload, busy, actionError, run } = useDonutsAdmin();

  return (
    <div className={styles.page}>
      <Link href="/donuts" className={styles.backLink}>
        ← Sunday donuts
      </Link>

      <header className={styles.head}>
        <h1 className={styles.title}>Donut rotation admin</h1>
        <p className={styles.tagline}>
          People, the base rotation, one-off overrides, and the history behind them.
        </p>
      </header>

      {loading && <div className={styles.state}>Loading the board…</div>}

      {!loading && error && (
        <div className={styles.state}>
          <p className={styles.error}>{error}</p>
          <button type="button" className={styles.button} onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {actionError && <p className={styles.error}>{actionError}</p>}

      {board && (
        <>
          <ScheduleOutlook board={board} busy={busy} run={run} />
          <PeopleEditor people={board.people} busy={busy} run={run} />
          <RotationEditor
            rotation={board.rotation}
            people={board.people}
            busy={busy}
            run={run}
          />
          <OverridesEditor board={board} busy={busy} run={run} />
          <AdminLog log={board.log} />
        </>
      )}
    </div>
  );
}
