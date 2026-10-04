import { setupParams, type GameSetup } from '../../variants';

/**
 * Share a link: the phone's share sheet when there is one (so it can go
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

/**
 * The origin for links meant for other people. A Vercel deployment's own
 * address — what the Vercel app opens — sits behind Vercel's login, so a
 * production build always links to the public production domain. Previews
 * and local dev link to wherever they are running.
 */
export function publicOrigin(): string {
  const productionHost = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && productionHost) return `https://${productionHost}`;
  return typeof window === 'undefined' ? '' : window.location.origin;
}

/** The link to send a friend for this game. */
export function gameUrl(gameId: string): string {
  return `${publicOrigin()}/tracer/${gameId}`;
}

/** A link that opens the lobby with this setup. */
export function setupUrl(setup: GameSetup): string {
  return `${publicOrigin()}/tracer?${setupParams(setup).toString()}`;
}
