import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { harnessLog, isHarnessEnabled } from '../harnessLog';

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_USE_EMULATORS = process.env.NEXT_PUBLIC_USE_EMULATORS;

function setEnv(node: string | undefined, useEmulators: string | undefined) {
  vi.stubEnv('NODE_ENV', node ?? '');
  vi.stubEnv('NEXT_PUBLIC_USE_EMULATORS', useEmulators ?? '');
}

describe('harnessLog gating', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    setEnv(ORIGINAL_NODE_ENV, ORIGINAL_USE_EMULATORS);
  });

  it('is enabled in development', () => {
    setEnv('development', undefined);
    expect(isHarnessEnabled()).toBe(true);
  });

  it('is enabled when emulators flag is set, even in production', () => {
    setEnv('production', 'true');
    expect(isHarnessEnabled()).toBe(true);
  });

  it('is disabled in production without the emulators flag', () => {
    setEnv('production', undefined);
    expect(isHarnessEnabled()).toBe(false);
  });

  it('logs with the correct tag and channel for info', () => {
    setEnv('development', undefined);
    harnessLog({ domain: 'voting', event: 'submit.start', data: { matchupId: 'abc' } });
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toBe('[harness:voting:submit.start]');
    expect(logSpy.mock.calls[0][1]).toEqual({ matchupId: 'abc' });
  });

  it('routes warn-level logs to console.warn', () => {
    setEnv('development', undefined);
    harnessLog({ domain: 'voting', event: 'phase.guard', level: 'warn' });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toBe('[harness:voting:phase.guard]');
  });

  it('routes error-level logs to console.error', () => {
    setEnv('development', undefined);
    harnessLog({ domain: 'voting', event: 'submit.failed', level: 'error', data: { error: 'oops' } });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toBe('[harness:voting:submit.failed]');
  });

  it('does not invoke any console method when disabled', () => {
    setEnv('production', undefined);
    harnessLog({ domain: 'voting', event: 'submit.start' });
    harnessLog({ domain: 'voting', event: 'submit.failed', level: 'error' });
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
