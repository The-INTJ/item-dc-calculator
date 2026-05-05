type Level = 'info' | 'warn' | 'error';

export interface HarnessLogInput {
  domain: string;
  event: string;
  level?: Level;
  data?: Record<string, unknown>;
}

export function isHarnessEnabled(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV !== 'production';
  }
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'
  );
}

export function harnessLog(input: HarnessLogInput): void {
  if (!isHarnessEnabled()) return;
  const { domain, event, level = 'info', data } = input;
  const tag = `[harness:${domain}:${event}]`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (data !== undefined) {
    sink(tag, data);
  } else {
    sink(tag);
  }
}
