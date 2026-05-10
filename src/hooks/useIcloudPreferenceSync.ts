import { replacePreferences, usePreferences } from '@app/store/preferenceStore';
import {
  isICloudPreferenceSyncAvailable,
  loadPreferencesFromICloud,
  savePreferencesToICloud,
  synchronizeICloudPreferences,
} from '@app/services/icloud-sync-service';
import { logger } from '@app/utils/logger';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useIcloudPreferenceSync() {
  const preferences = usePreferences();
  const latestLocalTimestampRef = useRef(preferences.updatedAt);
  const latestAppliedRemoteTimestampRef = useRef<number>(0);
  const hasAttemptedInitialLoadRef = useRef(false);

  latestLocalTimestampRef.current = preferences.updatedAt;

  useEffect(() => {
    if (!isICloudPreferenceSyncAvailable()) {
      return;
    }

    let cancelled = false;

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

    void applyRemotePreferences();

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void applyRemotePreferences();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (
      !isICloudPreferenceSyncAvailable() ||
      !hasAttemptedInitialLoadRef.current
    ) {
      return;
    }

    if (preferences.updatedAt <= latestAppliedRemoteTimestampRef.current) {
      return;
    }

    void savePreferencesToICloud(preferences).catch(error => {
      logger.main.warn('Failed to save iCloud preferences', error);
    });
  }, [preferences]);
}
