export function weatherTimeLabel(value: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(value);
  if (!match) return '—';
  const hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${minute} ${suffix}`;
}
