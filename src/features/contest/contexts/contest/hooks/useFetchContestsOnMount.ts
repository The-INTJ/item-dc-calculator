import { useEffect, useRef } from 'react';
import { contestApi } from '../../../lib/api/contestApi';
import { useAuth } from '../../auth/AuthContext';
import type { ContestContextStateUpdater } from '../contestTypes';

/**
 * useFetchContestsOnMount
 * 
 * Fetches all contests from the API when the component mounts.
 */
export function useFetchContestsOnMount(
  updateState: (updater: ContestContextStateUpdater) => void,
  reloadKey = 0,
  onComplete?: () => void
): void {
  const { loading: authLoading, session } = useAuth();
  const previousFetchKey = useRef<string | null>(null);

  useEffect(function fetchContestsOnMount() {
    if (authLoading) return;

    if (!session?.firebaseUid) {
      updateState((prev) => ({
        ...prev,
        contests: [],
        loading: false,
        error: null,
      }));
      return;
    }

    const fetchKey = `${session.firebaseUid}:${reloadKey}`;
    if (previousFetchKey.current === fetchKey) return;
    previousFetchKey.current = fetchKey;

    async function load() {
      updateState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      const result = await contestApi.listContests();
      if (result) {
        const { contests } = result;
        updateState((prev) => ({
          ...prev,
          contests,
          loading: false,
          error: null,
          lastUpdatedAt: Date.now(),
        }));
      } else {
        updateState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to load contests from Firestore.',
          lastUpdatedAt: Date.now(),
        }));
      }
      onComplete?.();
    }

    void load();
  }, [authLoading, session?.firebaseUid, updateState, reloadKey, onComplete]);
}
