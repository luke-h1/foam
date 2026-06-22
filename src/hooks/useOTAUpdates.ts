import { useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';

import { nativeBuildVersion } from 'expo-application';
import * as Updates from 'expo-updates';
import {
  addUpdatesStateChangeListener,
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  latestContext,
  reloadAsync,
  setExtraParamAsync,
} from 'expo-updates';

import i18next from '@app/i18n/i18next';
import { countOtaMetric } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

const MINIMUM_MINIMIZE_TIME = 15 * 60e3; // 15 minutes
const INITIAL_CHECK_DELAY = 3e3; // 3 seconds

const OTA_RELOAD_SCREEN_OPTIONS = {
  backgroundColor: theme.color.background.dark,
  fade: true,
  spinner: {
    color: theme.colorPrimary,
    size: 'large' as const,
  },
};

const getIsUpdatePending = () => latestContext.isUpdatePending;

export type OTAUpdateUrgency = 'normal' | 'critical';

export type OTAUpdateState = {
  status: 'idle' | 'checking' | 'downloading' | 'available' | 'pending';
  urgency: OTAUpdateUrgency;
  criticalIndex: number;
};

async function setExtraParams() {
  await setExtraParamAsync(
    Platform.OS === 'ios' ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  );
  await setExtraParamAsync('channel', Updates.channel || 'unknown');
}

export function useOTAUpdates() {
  const shouldReceiveUpdates = isEnabled && !__DEV__;
  const isProduction = process.env.EXPO_PUBLIC_APP_VARIANT === 'production';
  const appState = useRef<AppStateStatus>('active');
  const lastMinimize = useRef(0);
  const ranInitialCheck = useRef(false);
  const handledPendingUpdate = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const checkForUpdates = useCallback(async () => {
    if (!shouldReceiveUpdates) {
      return;
    }

    try {
      await setExtraParams();

      logger.main.info('Checking for OTA update', {
        name: 'ota_updates_service_info',
        category: 'ota',
        action: 'check_started',
        channel: Updates.channel || 'unknown',
        buildVersion: nativeBuildVersion,
        platform: Platform.OS,
        isProduction,
      });

      countOtaMetric('ota.check.started', {
        channel: Updates.channel || 'unknown',
        environment: isProduction ? 'production' : 'non-production',
        platform: Platform.OS,
      });

      const res = await checkForUpdateAsync();

      if (res.isAvailable) {
        logger.main.info('OTA update available', {
          name: 'ota_updates_service_info',
          category: 'ota',
          action: 'update_available',
          manifestId: res.manifest?.id,
          channel: Updates.channel || 'unknown',
          platform: Platform.OS,
        });

        countOtaMetric('ota.update.available', {
          channel: Updates.channel || 'unknown',
          environment: isProduction ? 'production' : 'non-production',
          platform: Platform.OS,
        });

        await fetchUpdateAsync();

        logger.main.info('OTA update fetched successfully', {
          name: 'ota_updates_service_info',
          category: 'ota',
          action: 'update_fetched',
          channel: Updates.channel || 'unknown',
          platform: Platform.OS,
        });

        countOtaMetric('ota.update.fetched', {
          channel: Updates.channel || 'unknown',
          environment: isProduction ? 'production' : 'non-production',
          platform: Platform.OS,
        });
      }
    } catch (error) {
      const parsedError =
        error instanceof Error ? error : new Error(String(error));

      logger.main.error('OTA update check failed', {
        name: 'ota_updates_service_error',
        error: parsedError,
        category: 'OTAUpdatesService',
        action: 'check_failed',
        isProduction,
        channel: Updates.channel || 'unknown',
        platform: Platform.OS,
      });
    }
  }, [isProduction, shouldReceiveUpdates]);

  const applyUpdate = useCallback(async () => {
    try {
      await reloadAsync({
        reloadScreenOptions: OTA_RELOAD_SCREEN_OPTIONS,
      });
    } catch (error) {
      const parsedError =
        error instanceof Error ? error : new Error(String(error));

      logger.main.error('OTA update reload failed', {
        name: 'ota_updates_service_error',
        error: parsedError,
        category: 'OTAUpdatesService',
        action: 'reload_failed',
        isProduction,
        channel: Updates.channel || 'unknown',
        platform: Platform.OS,
      });
    }
  }, [isProduction]);

  const promptAndReload = useCallback(() => {
    countOtaMetric('ota.update.alert_shown', {
      category: 'ota',
      platform: Platform.OS,
      channel: Updates.channel || 'unknown',
      environment: isProduction ? 'production' : 'non-production',
    });

    Alert.alert(
      i18next.t('updates:updateAvailable'),
      i18next.t('updates:updateAvailableMessage'),
      [
        {
          text: i18next.t('updates:relaunch'),
          style: 'default',
          onPress: () => {
            countOtaMetric('ota.update.applied', {
              category: 'ota',
              platform: Platform.OS,
              channel: Updates.channel || 'unknown',
              environment: isProduction ? 'production' : 'non-production',
              method: 'manual',
            });
            logger.main.info('App relaunch requested from OTA modal', {
              name: 'ota_updates_service_info',
              category: 'ota',
              action: 'manual_relaunch_requested',
              isProduction,
              platform: Platform.OS,
            });
            void applyUpdate();
          },
        },
      ],
      { cancelable: false },
    );
  }, [applyUpdate, isProduction]);

  const checkForUpdatesRef = useRef(checkForUpdates);
  checkForUpdatesRef.current = checkForUpdates;
  const promptAndReloadRef = useRef(promptAndReload);
  promptAndReloadRef.current = promptAndReload;
  const applyUpdateRef = useRef(applyUpdate);
  applyUpdateRef.current = applyUpdate;

  useEffect(() => {
    if (!shouldReceiveUpdates || ranInitialCheck.current) {
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
  }, [isProduction, shouldReceiveUpdates]);

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
        platform: Platform.OS,
      });

      countOtaMetric('ota.update.pending', {
        channel: Updates.channel || 'unknown',
        environment: isProduction ? 'production' : 'non-production',
        platform: Platform.OS,
      });

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
  }, [isProduction]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          const shouldUpdate =
            isProduction ||
            lastMinimize.current <= Date.now() - MINIMUM_MINIMIZE_TIME;

          if (shouldUpdate) {
            if (getIsUpdatePending()) {
              if (isProduction) {
                logger.main.info(
                  'App foregrounded with pending update, reloading',
                  {
                    name: 'ota_updates_service_info',
                    category: 'ota',
                    action: 'foreground_auto_reload',
                    timeSinceMinimize: Date.now() - lastMinimize.current,
                    isProduction,
                  },
                );

                countOtaMetric('ota.update.applied', {
                  category: 'ota',
                  environment: isProduction ? 'production' : 'non-production',
                  platform: Platform.OS,
                  method: 'auto_on_foreground',
                  channel: Updates.channel || 'unknown',
                });

                await applyUpdateRef.current();
              } else {
                promptAndReloadRef.current();
              }
            } else {
              logger.main.info('App foregrounded, checking for updates', {
                name: 'ota_updates_service_info',
                category: 'ota',
                action: 'foreground_check_for_updates',
                timeSinceMinimize: Date.now() - lastMinimize.current,
                isProduction,
              });

              void checkForUpdatesRef.current();
            }
          }
        }

        appState.current = nextAppState;

        if (nextAppState === 'inactive' || nextAppState === 'background') {
          lastMinimize.current = Date.now();
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isProduction]);
}
