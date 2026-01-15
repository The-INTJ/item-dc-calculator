/// <reference types="vitest" />

import { describe, expect, it, vi } from 'vitest';
import { parseInviteSearchParams } from '../invite';
import { createGuestSession } from '../storage';
import type { InviteContext } from '../types';

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

describe('createGuestSession', () => {
  it('stores invite context and guest identity', () => {
    const inviteContext: InviteContext = {
      inviteId: 'invite_1',
      contestSlug: 'spring-2026',
      source: 'email',
      receivedAt: 123456,
    };

    const session = createGuestSession({
      displayName: 'Guest Tester',
      guestId: 'guest_abc',
      guestIndex: ['guest_abc'],
      inviteContext,
    });

    expect(session.profile.displayName).toBe('Guest Tester');
    expect(session.inviteContext).toEqual(inviteContext);
    expect(session.guestIdentity).toEqual({
      guestId: 'guest_abc',
      guestIndex: ['guest_abc'],
    });
  });
});
