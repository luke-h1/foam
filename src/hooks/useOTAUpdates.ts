import { sentryService } from '@app/services/sentry-service';
import { nativeBuildVersion } from 'expo-application';
import * as Updates from 'expo-updates';
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  setExtraParamAsync,
  useUpdates,
} from 'expo-updates';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

const MINIMUM_MINIMIZE_TIME = 5 * 60e3; // 5 minutes

async function setExtraParams() {
  await setExtraParamAsync(
    Platform.OS === 'ios' ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  );
  await setExtraParamAsync('channel', Updates.channel || 'unknown');
}

interface UseOTAUpdatesOptions {
  /**
   * Whether the app is ready to check for updates.
   * Pass true only after auth context and other critical initialization is complete.
   */
  isReady: boolean;
}

export type OTAUpdateState = {
  status: 'idle' | 'checking' | 'downloading' | 'available' | 'pending';
};

export function useOTAUpdates({ isReady }: UseOTAUpdatesOptions) {
  const shouldReceiveUpdates = isEnabled && !__DEV__;
  const isProduction = process.env.APP_VARIANT === 'production';
  const appState = useRef<AppStateStatus>('active');
  const lastMinimize = useRef(0);
  const ranInitialCheck = useRef(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const updates = useUpdates();

  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Track previous state to only log changes
  const previousState = useRef<OTAUpdateState['status']>('idle');

  // Determine update state from expo-updates
  const updateState: OTAUpdateState = useMemo(() => {
    let status: OTAUpdateState['status'] = 'idle';

    if (updates.isUpdatePending) {
      status = 'pending';
    } else if (updates.isDownloading) {
      status = 'downloading';
    } else if (updates.isChecking) {
      status = 'checking';
    } else if (updates.isUpdateAvailable) {
      status = 'available';
    }

    // Log state changes as breadcrumbs (only when state actually changes)
    if (status !== previousState.current) {
      sentryService.addBreadcrumb({
        category: 'ota',
        message: `OTA state changed: ${previousState.current} → ${status}`,
        level: 'info',
        data: {
          previousStatus: previousState.current,
          newStatus: status,
          isUpdatePending: updates.isUpdatePending,
          isDownloading: updates.isDownloading,
          isChecking: updates.isChecking,
          isUpdateAvailable: updates.isUpdateAvailable,
        },
      });
      previousState.current = status;
    }

    return { status };
  }, [
    updates.isUpdatePending,
    updates.isDownloading,
    updates.isChecking,
    updates.isUpdateAvailable,
  ]);

  const checkForUpdates = useCallback(async () => {
    try {
      await setExtraParams();

      console.debug('Checking for update...');
      sentryService.addBreadcrumb({
        category: 'ota',
        message: 'Checking for OTA update',
        level: 'info',
        data: {
          channel: Updates.channel || 'unknown',
          buildVersion: nativeBuildVersion,
          platform: Platform.OS,
          isProduction,
        },
      });

      // Track metric for dashboard (using message with specific tag)
      sentryService.captureMessage('ota.check.started', {
        level: 'info',
        tags: {
          category: 'ota_metric',
          metric_name: 'ota.check.started',
          platform: Platform.OS,
          channel: Updates.channel || 'unknown',
          environment: isProduction ? 'production' : 'non-production',
        },
      });

      const res = await checkForUpdateAsync();
      setLastChecked(new Date());

      sentryService.setContext('ota_update_check', {
        isAvailable: res.isAvailable,
        manifest: res.manifest
          ? {
              id: res.manifest.id,
            }
          : null,
        channel: Updates.channel || 'unknown',
        buildVersion: nativeBuildVersion,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      });

      if (res.isAvailable) {
        console.debug('Attempting to fetch update...');
        sentryService.captureMessage('OTA update available', {
          level: 'info',
          tags: {
            category: 'ota',
            action: 'update_available',
          },
          extra: {
            manifestId: res.manifest?.id,
          },
        });

        // Track metric for dashboard (using message with specific tag)
        sentryService.captureMessage('ota.update.available', {
          level: 'info',
          tags: {
            category: 'ota_metric',
            metric_name: 'ota.update.available',
            platform: Platform.OS,
            channel: Updates.channel || 'unknown',
            environment: isProduction ? 'production' : 'non-production',
          },
        });

        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'Fetching OTA update',
          level: 'info',
        });

        await fetchUpdateAsync();

        sentryService.captureMessage('OTA update fetched successfully', {
          level: 'info',
          tags: {
            category: 'ota',
            action: 'update_fetched',
          },
        });

        // Track metric for dashboard (using message with specific tag)
        sentryService.captureMessage('ota.update.fetched', {
          level: 'info',
          tags: {
            category: 'ota_metric',
            metric_name: 'ota.update.fetched',
            platform: Platform.OS,
            channel: Updates.channel || 'unknown',
            environment: isProduction ? 'production' : 'non-production',
          },
        });

        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'OTA update fetched, waiting for pending state',
          level: 'info',
        });
        // Modal will be shown by the useEffect that watches isUpdatePending
      } else {
        console.debug('No update available.');
        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'No OTA update available',
          level: 'info',
        });
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error('OTA Update Error', { error: `${e}` });

      sentryService.captureException(error, {
        tags: {
          category: 'ota',
          action: 'update_check_error',
        },
        extra: {
          channel: Updates.channel || 'unknown',
          buildVersion: nativeBuildVersion,
          platform: Platform.OS,
          isProduction,
        },
      });
    }
  }, [isProduction]);

  const handleApply = useCallback(async () => {
    setModalVisible(false);

    sentryService.captureMessage('OTA update applied by user', {
      level: 'info',
      tags: {
        category: 'ota',
        action: 'update_applied',
      },
      extra: {
        channel: Updates.channel || 'unknown',
        buildVersion: nativeBuildVersion,
        platform: Platform.OS,
        isProduction,
      },
    });

    // Track metric for dashboard (using message with specific tag)
    sentryService.captureMessage('ota.update.applied', {
      level: 'info',
      tags: {
        category: 'ota_metric',
        metric_name: 'ota.update.applied',
        platform: Platform.OS,
        channel: Updates.channel || 'unknown',
        environment: isProduction ? 'production' : 'non-production',
        method: 'manual',
      },
    });

    sentryService.addBreadcrumb({
      category: 'ota',
      message: 'Reloading app to apply OTA update',
      level: 'info',
    });

    // Note: We don't clear navigation state or React Query cache before reload
    // because reloadAsync() completely restarts the app, and any JavaScript
    // state changes made before the reload won't persist anyway. The app will
    // start fresh with a clean navigation stack and re-hydrate auth from SecureStore.
    await reloadAsync();
  }, [isProduction]);

  const handleDismiss = useCallback(() => {
    setModalVisible(false);

    sentryService.addBreadcrumb({
      category: 'ota',
      message: 'OTA update modal dismissed by user',
      level: 'info',
    });
  }, []);

  // Initial check - only runs after app is ready
  useEffect(() => {
    if (!isReady || !shouldReceiveUpdates || ranInitialCheck.current) {
      return;
    }

    sentryService.addBreadcrumb({
      category: 'ota',
      message: 'Starting initial OTA check',
      level: 'info',
      data: {
        isProduction,
        shouldReceiveUpdates,
        isReady,
      },
    });

    if (isProduction) {
      ranInitialCheck.current = true;
      void checkForUpdates();
    } else {
      timeout.current = setTimeout(() => {
        ranInitialCheck.current = true;
        void checkForUpdates();
      }, 10e3);
    }

    return () => {
      clearTimeout(timeout.current);
    };
  }, [isReady, shouldReceiveUpdates, checkForUpdates, isProduction]);

  useEffect(() => {
    if (
      updates.isUpdatePending &&
      !updates.isDownloading &&
      !updates.isChecking
    ) {
      sentryService.captureMessage('OTA update pending - ready to apply', {
        level: 'info',
        tags: {
          category: 'ota',
          action: 'update_pending',
        },
        extra: {
          channel: Updates.channel || 'unknown',
          buildVersion: nativeBuildVersion,
          platform: Platform.OS,
          isProduction,
          availableUpdate: updates.availableUpdate
            ? {
                ...('id' in updates.availableUpdate
                  ? { id: String(updates.availableUpdate.id) }
                  : {}),
              }
            : null,
        },
      });

      // Track metric for dashboard (using message with specific tag)
      sentryService.captureMessage('ota.update.pending', {
        level: 'info',
        tags: {
          category: 'ota_metric',
          metric_name: 'ota.update.pending',
          platform: Platform.OS,
          channel: Updates.channel || 'unknown',
          environment: isProduction ? 'production' : 'non-production',
        },
      });

      if (isProduction) {
        // In production, auto-reload immediately for instant OTA
        sentryService.captureMessage(
          'OTA update auto-reloading in production',
          {
            level: 'info',
            tags: {
              category: 'ota',
              action: 'auto_reload',
            },
          },
        );

        // Track metric for dashboard (using message with specific tag)
        sentryService.captureMessage('ota.update.applied', {
          level: 'info',
          tags: {
            category: 'ota_metric',
            metric_name: 'ota.update.applied',
            platform: Platform.OS,
            channel: Updates.channel || 'unknown',
            environment: 'production',
            method: 'auto',
          },
        });

        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'Auto-reloading app in production to apply OTA update',
          level: 'info',
        });

        // Note: We don't clear navigation state or React Query cache before reload
        // because reloadAsync() completely restarts the app, and any JavaScript
        // state changes made before the reload won't persist anyway. The app will
        // start fresh with a clean navigation stack and re-hydrate auth from SecureStore.
        void reloadAsync();
      } else {
        // In non-production, show modal to let user choose
        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'Showing OTA update modal to user',
          level: 'info',
        });

        setModalVisible(true);
      }
    }
  }, [
    updates.isUpdatePending,
    updates.isDownloading,
    updates.isChecking,
    updates.availableUpdate,
    isProduction,
  ]);

  // After the app has been minimized for 5 minutes, we want to either A. install an update if one has become available
  // or B check for an update again.
  useEffect(() => {
    if (!isEnabled || !isReady) return;

    const subscription = AppState.addEventListener(
      'change',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // In production, run updates immediately when app comes to foreground
          // Otherwise, wait 5 minutes since the last "minimize" to feel comfortable updating
          const shouldUpdate =
            isProduction ||
            lastMinimize.current <= Date.now() - MINIMUM_MINIMIZE_TIME;

          if (shouldUpdate) {
            if (updates.isUpdatePending) {
              sentryService.addBreadcrumb({
                category: 'ota',
                message: 'App foregrounded with pending update, reloading',
                level: 'info',
                data: {
                  timeSinceMinimize: Date.now() - lastMinimize.current,
                  isProduction,
                },
              });

              await reloadAsync();
            } else {
              sentryService.addBreadcrumb({
                category: 'ota',
                message: 'App foregrounded, checking for updates',
                level: 'info',
                data: {
                  timeSinceMinimize: Date.now() - lastMinimize.current,
                  isProduction,
                },
              });

              void checkForUpdates();
            }
          }
        } else {
          lastMinimize.current = Date.now();
        }

        appState.current = nextAppState;
      },
    );

    return () => {
      clearTimeout(timeout.current);
      subscription.remove();
    };
  }, [updates.isUpdatePending, checkForUpdates, isReady, isProduction]);

  return {
    lastChecked,
    updateState,
    modalVisible,
    onApply: handleApply,
    onDismiss: handleDismiss,
  };
}
