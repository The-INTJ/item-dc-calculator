import { describe, expect, it, beforeEach } from 'vitest';
import {
  addGuestToIndex,
  getGuestId,
  getGuestIndex,
  setGuestId,
  setGuestIndex,
} from '../cookies';

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

describe('guest cookies', () => {
  beforeEach(() => {
    clearCookie('mixology_guest_id');
    clearCookie('mixology_guest_index');
  });

  it('reads and writes guest id', () => {
    expect(getGuestId()).toBeNull();

    setGuestId('guest_123');
    expect(getGuestId()).toBe('guest_123');
  });

  it('stores and updates guest index', () => {
    expect(getGuestIndex()).toEqual([]);

    setGuestIndex(['guest_a']);
    expect(getGuestIndex()).toEqual(['guest_a']);

    const updated = addGuestToIndex('guest_b');
    expect(updated).toEqual(['guest_a', 'guest_b']);
    expect(getGuestIndex()).toEqual(['guest_a', 'guest_b']);
  });
});
