/** Whole calendar days from one `YYYY-MM-DD` date to another. */
export function daysBetween(fromIso: string, toIso: string) {
  const toUtc = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / 86_400_000);
}

/** The calendar date of `instant` in `timeZone`, as `YYYY-MM-DD`. */
export function isoDateIn(instant: Date, timeZone: string) {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(instant);
}
