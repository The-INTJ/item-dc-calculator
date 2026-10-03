/**
 * Share a game link: the phone's share sheet when there is one (so it can go
 * straight into a message), otherwise the clipboard.
 */
export async function shareLink(text: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator === 'undefined') return 'failed';
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Tracer', text, url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'failed';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function gameUrl(gameId: string): string {
  return typeof window === 'undefined' ? `/tracer/${gameId}` : `${window.location.origin}/tracer/${gameId}`;
}
