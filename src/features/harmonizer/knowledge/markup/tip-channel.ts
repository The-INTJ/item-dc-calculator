/**
 * One-tip-at-a-time channel. Every Term instance subscribes; opening a tip
 * broadcasts its instance id and every OTHER instance closes. Module-scoped —
 * cheap, portal-free, and reset-free (listeners unsubscribe on unmount).
 */

type TipListener = (instanceId: string) => void;

const listeners = new Set<TipListener>();

export function subscribe(listener: TipListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcast(instanceId: string): void {
  for (const listener of [...listeners]) {
    listener(instanceId);
  }
}
