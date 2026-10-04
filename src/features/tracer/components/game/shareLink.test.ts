import { afterEach, describe, expect, it, vi } from 'vitest';

import { ORIGINAL_V1 } from '../../variants';
import { gameUrl, setupUrl } from './shareLink';

describe('links for friends', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('use the public production domain, whatever address the sender is on', () => {
    // The Vercel app opens a deployment's own URL, which sits behind Vercel's login.
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', 'item-dc-calculator.vercel.app');
    expect(gameUrl('AbCdEfGhIjKlMnOpQrSt')).toBe('https://item-dc-calculator.vercel.app/tracer/AbCdEfGhIjKlMnOpQrSt');
    expect(setupUrl({ styleId: ORIGINAL_V1.id, rules: ORIGINAL_V1.rules })).toBe(
      'https://item-dc-calculator.vercel.app/tracer?style=v1-original',
    );
  });

  it('stay on the current address in previews and local dev', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL', 'item-dc-calculator.vercel.app');
    expect(gameUrl('AbCdEfGhIjKlMnOpQrSt')).toBe(`${window.location.origin}/tracer/AbCdEfGhIjKlMnOpQrSt`);
  });
});
