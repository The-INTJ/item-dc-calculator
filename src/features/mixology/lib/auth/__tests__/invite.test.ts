import { describe, expect, it, vi } from 'vitest';
import { parseInviteSearchParams } from '../invite';

describe('parseInviteSearchParams', () => {
  it('returns null when invite is missing', () => {
    const params = new URLSearchParams('contest=summer-2026');
    expect(parseInviteSearchParams(params)).toBeNull();
  });

  it('parses invite context with timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T00:00:00Z'));
    const params = new URLSearchParams('invite=abc123&contest=summer-2026&source=qr');
    const result = parseInviteSearchParams(params);

    expect(result).toEqual({
      inviteId: 'abc123',
      contestSlug: 'summer-2026',
      source: 'qr',
      receivedAt: new Date('2026-01-15T00:00:00Z').getTime(),
    });
    vi.useRealTimers();
  });
});
