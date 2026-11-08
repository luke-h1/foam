import { useEffect, useRef } from 'react';

import { useObserveEffect } from '@legendapp/state/react';

import {
  isICloudPreferenceSyncAvailable,
  loadPreferencesFromICloud,
  savePreferencesToICloud,
  synchronizeICloudPreferences,
} from '@app/lib/icloudSync';
import {
  applyRemotePreferences,
  getPreferences,
  type Preferences,
  preferences$,
} from '@app/store/preference-store';
import { subscribeToAppStateTransitions } from '@app/utils/app-state/appStateTransitions';
import { logger } from '@app/utils/logger';
import { runWhenIdle } from '@app/utils/runWhenIdle';

/**
 * A slider or a run of toggles writes many times in a row. The wait sends one
 * iCloud write for the run.
 */
const ICLOUD_SAVE_DEBOUNCE_MS = 500;

export function useIcloudPreferenceSync() {
  const latestSyncedTimestampRef = useRef<number>(0);
  const hasAttemptedInitialLoadRef = useRef(false);
  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = (preferences: Preferences) => {
    latestSyncedTimestampRef.current = preferences.updatedAt;

    if (pendingSaveRef.current) {
      clearTimeout(pendingSaveRef.current);
    }

    pendingSaveRef.current = setTimeout(() => {
      pendingSaveRef.current = null;

      savePreferencesToICloud(preferences).catch((error: unknown) => {
        logger.main.warn('Failed to save iCloud preferences', error);
      });
    }, ICLOUD_SAVE_DEBOUNCE_MS);
  };

  useEffect(() => {
    if (!isICloudPreferenceSyncAvailable()) {
      return;
    }

    let cancelled = false;
    let pendingSync: { cancel: () => void } | null = null;

    const applyRemote = async () => {
      try {
        await synchronizeICloudPreferences();
        const remotePreferences = await loadPreferencesFromICloud();

        if (cancelled) {
          return;
        }

        const local = getPreferences();
        const remoteUpdatedAt = remotePreferences?.updatedAt ?? 0;

        latestSyncedTimestampRef.current = Math.max(
          latestSyncedTimestampRef.current,
          remoteUpdatedAt,
        );

        if (remotePreferences && remoteUpdatedAt > local.updatedAt) {
          applyRemotePreferences(remotePreferences);
          return;
        }

        if (local.updatedAt > remoteUpdatedAt) {
          scheduleSave(local);
        }
      } catch (error) {
        logger.main.warn('Failed to load iCloud preferences', error);
      }
    };

    const queueRemoteSync = () => {
      pendingSync?.cancel();
      pendingSync = runWhenIdle(() => {
        void applyRemote().finally(() => {
          hasAttemptedInitialLoadRef.current = true;
        });
      });
    };

    queueRemoteSync();

    const unsubscribe = subscribeToAppStateTransitions(({ current }) => {
      if (current === 'active') {
        queueRemoteSync();
      }
    });

    return () => {
      cancelled = true;
      pendingSync?.cancel();
      unsubscribe();

      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current);
      }
    };
  }, []);

  useObserveEffect(
    () => preferences$.get(),
    ({ value: preferences }) => {
      const nextPreferences = preferences ?? getPreferences();

      if (
        !isICloudPreferenceSyncAvailable() ||
        !hasAttemptedInitialLoadRef.current ||
        nextPreferences.updatedAt <= latestSyncedTimestampRef.current
      ) {
        return;
      }

      scheduleSave(nextPreferences);
    },
  );
}
