import { requirePlantAccess } from '../../plants/_lib/requirePlantAccess';

/**
 * Tip writes are owner-only by default. A deployment can also provide a
 * private GRASS_MANAGER_TIPS_API_KEY for an agent or scheduled content job.
 */
export async function requireTipEditor(request: Request) {
  const configuredKey = process.env.GRASS_MANAGER_TIPS_API_KEY;
  const suppliedKey = request.headers.get('x-grass-manager-key');
  if (configuredKey && suppliedKey === configuredKey) return null;
  return requirePlantAccess(request);
}
