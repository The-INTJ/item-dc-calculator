'use client';

import Link from 'next/link';

import { DeclineDialog } from './DeclineDialog';
import styles from './DonutsView.module.scss';
import { NextUpNote } from './NextUpNote';
import { RecentSwaps } from './RecentSwaps';
import { UpcomingCard } from './UpcomingCard';
import { useDonutBoard } from './useDonutBoard';
import { useSwapActions } from './useSwapActions';
import { useUpcomingSundays } from './useUpcomingSundays';
import { VolunteerDialog } from './VolunteerDialog';

/** The public donut rotation page: one big answer, everything else quiet. */
export function DonutsView() {
  const { board, loading, error, reload, apply } = useDonutBoard();
  const { today, upcoming, following } = useUpcomingSundays(board);
  const swap = useSwapActions(upcoming?.date ?? null, apply);

  const ready = board && upcoming && following;

  return (
    <div className={styles.shell}>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backLink}>
            ← Experiments
          </Link>
        </div>

        <header className={styles.head}>
          <h1 className={styles.title}>Sunday Donuts</h1>
          <p className={styles.tagline}>Whose turn it is to bring breakfast.</p>
        </header>

        {(loading || (!error && !ready)) && (
          <div className={styles.state}>Checking the rotation…</div>
        )}

        {!loading && error && (
          <div className={styles.state}>
            <span>{error}</span>
            <button type="button" className={styles.secondaryButton} onClick={reload}>
              Try again
            </button>
          </div>
        )}

        {ready && (
          <>
            <UpcomingCard
              sunday={upcoming}
              isToday={today === upcoming.date}
              busy={swap.busy}
              onDecline={() => swap.open('decline')}
              onVolunteer={() => swap.open('volunteer')}
            />
            <NextUpNote sunday={following} />
            <RecentSwaps log={board.log} />
          </>
        )}

        {ready && swap.dialog === 'decline' && (
          <DeclineDialog
            personName={upcoming.personName}
            busy={swap.busy}
            error={swap.error}
            onConfirm={swap.decline}
            onCancel={swap.close}
          />
        )}

        {ready && swap.dialog === 'volunteer' && (
          <VolunteerDialog
            people={board.people.filter((person) => person.active)}
            busy={swap.busy}
            error={swap.error}
            onConfirm={swap.volunteer}
            onCancel={swap.close}
          />
        )}
      </div>
    </div>
  );
}
