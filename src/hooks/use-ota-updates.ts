import { useCallback, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';

import { nativeBuildVersion } from 'expo-application';
import {
  addUpdatesStateChangeListener,
  latestContext,
  setExtraParamAsync,
} from 'expo-updates';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import { countOtaMetric } from '@app/lib/sentry';
import {
  isForegroundTransition,
  subscribeToAppStateTransitions,
} from '@app/utils/app-state/appStateTransitions';
import { OTA_UPDATES_ACTIVE } from '@app/utils/app-update/constants';
import {
  isProductionVariant,
  otaTelemetryFields,
} from '@app/utils/app-update/otaTelemetry';
import {
  checkAndFetchOtaUpdate,
  reloadIntoOtaUpdate,
} from '@app/utils/app-update/otaUpdateFlow';
import { logger } from '@app/utils/logger';

const MINIMUM_MINIMIZE_TIME = 15 * 60e3;
const INITIAL_CHECK_DELAY = 3e3;

const getIsUpdatePending = () => latestContext.isUpdatePending;

async function setExtraParams() {
  await setExtraParamAsync(
    Platform.OS === 'ios' ? 'ios-build-number' : 'android-build-number',
    // `buildVersion` is not actually a string on Android despite the TS type.
    `${nativeBuildVersion}`,
  );
  await setExtraParamAsync('channel', otaTelemetryFields().channel);
}

async function fetchAvailableOtaUpdate(isProduction: boolean): Promise<void> {
  const fields = otaTelemetryFields();

  try {
    await setExtraParams();

    logger.main.info('Checking for OTA update', {
      name: 'ota_updates_service_info',
      category: 'ota',
      action: 'check_started',
      buildVersion: nativeBuildVersion,
      isProduction,
      ...fields,
    });

    countOtaMetric('ota.check.started', fields);

    const fetched = await checkAndFetchOtaUpdate({
      onUpdateAvailable: manifestId => {
        logger.main.info('OTA update available', {
          name: 'ota_updates_service_info',
          category: 'ota',
          action: 'update_available',
          manifestId,
          ...fields,
        });

        countOtaMetric('ota.update.available', fields);
      },
    });

    if (!fetched) {
      return;
    }

    logger.main.info('OTA update fetched successfully', {
      name: 'ota_updates_service_info',
      category: 'ota',
      action: 'update_fetched',
      ...fields,
    });

    countOtaMetric('ota.update.fetched', fields);
  } catch (error) {
    logger.main.error('OTA update check failed', {
      name: 'ota_updates_service_error',
      error: error instanceof Error ? error : new Error(String(error)),
      category: 'OTAUpdatesService',
      action: 'check_failed',
      isProduction,
      ...fields,
    });
  }
}

export function useOTAUpdates() {
  const isProduction = isProductionVariant();
  const lastMinimize = useRef(0);
  const ranInitialCheck = useRef(false);
  const handledPendingUpdate = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const checkForUpdates = useCallback(async () => {
    if (!OTA_UPDATES_ACTIVE) {
      return;
    }

    await fetchAvailableOtaUpdate(isProduction);
  }, [isProduction]);

  const applyUpdate = useCallback(async () => {
    try {
      await reloadIntoOtaUpdate();
    } catch (error) {
      logger.main.error('OTA update reload failed', {
        name: 'ota_updates_service_error',
        error: error instanceof Error ? error : new Error(String(error)),
        category: 'OTAUpdatesService',
        action: 'reload_failed',
        isProduction,
        ...otaTelemetryFields(),
      });
    }
  }, [isProduction]);

  const promptAndReload = useCallback(() => {
    countOtaMetric('ota.update.alert_shown', {
      category: 'ota',
      ...otaTelemetryFields(),
    });

    Alert.alert(
      'Update Available',
      'A new version is ready to install. Relaunch now?',
      [
        {
          text: 'Relaunch',
          style: 'default',
          onPress: () => {
            countOtaMetric('ota.update.applied', {
              category: 'ota',
              ...otaTelemetryFields(),
              method: 'manual',
            });

            logger.main.info('App relaunch requested from OTA modal', {
              name: 'ota_updates_service_info',
              category: 'ota',
              action: 'manual_relaunch_requested',
              isProduction,
              ...otaTelemetryFields(),
            });

            void applyUpdate();
          },
        },
      ],
      { cancelable: false },
    );
  }, [applyUpdate, isProduction]);

  const checkForUpdatesRef = useSyncRef(checkForUpdates);
  const promptAndReloadRef = useSyncRef(promptAndReload);

  useEffect(() => {
    if (!OTA_UPDATES_ACTIVE || ranInitialCheck.current) {
      return;
    }

    ranInitialCheck.current = true;

    timeout.current = setTimeout(
      () => {
        void checkForUpdatesRef.current();
      },
      isProduction ? MINIMUM_MINIMIZE_TIME : INITIAL_CHECK_DELAY,
    );

    return () => {
      clearTimeout(timeout.current);
    };
  }, [checkForUpdatesRef, isProduction]);

  useEffect(() => {
    const handlePendingUpdate = () => {
      if (!getIsUpdatePending()) {
        handledPendingUpdate.current = false;
        return;
      }

      if (handledPendingUpdate.current) {
        return;
      }

      handledPendingUpdate.current = true;

      logger.main.info('OTA update pending - ready to apply', {
        name: 'ota_updates_service_info',
        category: 'ota',
        action: 'update_pending',
        isProduction,
        buildVersion: nativeBuildVersion,
        ...otaTelemetryFields(),
      });

      countOtaMetric('ota.update.pending', otaTelemetryFields());

      if (!isProduction) {
        promptAndReloadRef.current();
      }
    };

    handlePendingUpdate();

    const subscription = addUpdatesStateChangeListener(() => {
      handlePendingUpdate();
    });

    return () => {
      subscription.remove();
    };
  }, [isProduction, promptAndReloadRef]);

  useEffect(() => {
    if (!OTA_UPDATES_ACTIVE) {
      return;
    }

    const unsubscribe = subscribeToAppStateTransitions(transition => {
      if (
        transition.current === 'inactive' ||
        transition.current === 'background'
      ) {
        lastMinimize.current = Date.now();
        return;
      }

      if (!isForegroundTransition(transition)) {
        return;
      }

      const shouldUpdate =
        isProduction ||
        lastMinimize.current <= Date.now() - MINIMUM_MINIMIZE_TIME;

      if (!shouldUpdate) {
        return;
      }

      if (!getIsUpdatePending()) {
        logger.main.info('App foregrounded, checking for updates', {
          name: 'ota_updates_service_info',
          category: 'ota',
          action: 'foreground_check_for_updates',
          timeSinceMinimize: Date.now() - lastMinimize.current,
          isProduction,
        });

        void checkForUpdatesRef.current();
        return;
      }

      if (!isProduction) {
        promptAndReloadRef.current();
        return;
      }

      // No reload here: reloadAsync() races the foreground reconnect refetch burst and tears down the runtime mid-fetch (#699); the downloaded update applies on next cold start.
      logger.main.info(
        'App foregrounded with pending update, deferring to cold start',
        {
          name: 'ota_updates_service_info',
          category: 'ota',
          action: 'foreground_defer_to_cold_start',
          timeSinceMinimize: Date.now() - lastMinimize.current,
          isProduction,
        },
      );

      countOtaMetric('ota.update.deferred', {
        category: 'ota',
        ...otaTelemetryFields(),
        method: 'cold_start',
      });
    });

    return () => {
      unsubscribe();
    };
  }, [checkForUpdatesRef, isProduction, promptAndReloadRef]);
}
