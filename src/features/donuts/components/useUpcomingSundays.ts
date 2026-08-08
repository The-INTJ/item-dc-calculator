'use client';

import { useEffect, useMemo, useState } from 'react';

import { resolveSundayOn } from '../lib/schedule';
import { addWeeks, todayIso, upcomingSunday } from '../lib/sundays';
import type { DonutBoard, IsoDate, ResolvedSunday } from '../lib/types';

interface UpcomingSundays {
  /** Null until the browser's own date is known, which avoids a hydration mismatch. */
  today: IsoDate | null;
  upcoming: ResolvedSunday | null;
  following: ResolvedSunday | null;
}

/**
 * The next two Sundays, resolved against the viewer's local calendar. Today
 * counts as "upcoming" when it is a Sunday — the donuts are that morning.
 */
export function useUpcomingSundays(board: DonutBoard | null): UpcomingSundays {
  const [today, setToday] = useState<IsoDate | null>(null);

  useEffect(() => {
    setToday(todayIso());
  }, []);

  return useMemo(() => {
    if (!board || !today) {
      return { today, upcoming: null, following: null };
    }
    const next = upcomingSunday(today);
    return {
      today,
      upcoming: resolveSundayOn(board, next),
      following: resolveSundayOn(board, addWeeks(next, 1)),
    };
  }, [board, today]);
}
