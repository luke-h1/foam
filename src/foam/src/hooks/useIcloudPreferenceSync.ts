import { useEffect, useRef } from 'react';
import { AppState, InteractionManager } from 'react-native';

import { useObserveEffect } from '@legendapp/state/react';

import {
  isICloudPreferenceSyncAvailable,
  loadPreferencesFromICloud,
  savePreferencesToICloud,
  synchronizeICloudPreferences,
} from '@app/lib/icloud-sync';
import {
  getPreferences,
  preferences$,
  replacePreferences,
} from '@app/store/preferenceStore';
import { logger } from '@app/utils/logger';

export function useIcloudPreferenceSync() {
  const latestLocalTimestampRef = useRef(getPreferences().updatedAt);
  const latestAppliedRemoteTimestampRef = useRef<number>(0);
  const hasAttemptedInitialLoadRef = useRef(false);

  useEffect(() => {
    if (!isICloudPreferenceSyncAvailable()) {
      return;
    }

    let cancelled = false;
    let pendingSync: { cancel: () => void } | null = null;

    const queueRemoteSync = () => {
      pendingSync?.cancel();
      pendingSync = InteractionManager.runAfterInteractions(() => {
        void applyRemotePreferences();
      });
    };

    const applyRemotePreferences = async () => {
      try {
        await synchronizeICloudPreferences();
        const remotePreferences = await loadPreferencesFromICloud();

        if (!remotePreferences || cancelled) {
          return;
        }

        latestAppliedRemoteTimestampRef.current = Math.max(
          latestAppliedRemoteTimestampRef.current,
          remotePreferences.updatedAt,
        );

        if (remotePreferences.updatedAt > latestLocalTimestampRef.current) {
          replacePreferences(remotePreferences);
        }
      } catch (error) {
        logger.main.warn('Failed to load iCloud preferences', error);
      } finally {
        hasAttemptedInitialLoadRef.current = true;
      }
    };

    queueRemoteSync();

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        queueRemoteSync();
      }
    });

    return () => {
      cancelled = true;
      pendingSync?.cancel();
      subscription.remove();
    };
  }, []);

  useObserveEffect(
    () => preferences$.get(),
    ({ value: preferences }) => {
      const nextPreferences = preferences ?? getPreferences();
      latestLocalTimestampRef.current = nextPreferences.updatedAt;

      if (
        !isICloudPreferenceSyncAvailable() ||
        !hasAttemptedInitialLoadRef.current
      ) {
        return;
      }

      if (
        nextPreferences.updatedAt <= latestAppliedRemoteTimestampRef.current
      ) {
        return;
      }

      void savePreferencesToICloud(nextPreferences).catch(error => {
        logger.main.warn('Failed to save iCloud preferences', error);
      });
    },
  );
}
