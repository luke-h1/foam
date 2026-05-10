import { countMetric, sentryService } from '@app/services/sentry-service';
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
const PERIODIC_CHECK_INTERVAL = 30 * 60e3; // 30 minutes

type OTAUpdateUrgency = 'normal' | 'critical';

type ExpoManifestLike = NonNullable<
  ReturnType<typeof useUpdates>['currentlyRunning']['manifest']
>;

type OtaExtra = {
  ota?: {
    criticalIndex?: number;
  };
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

interface UseOTAUpdatesOptions {
  /**
   * Whether the app is ready to check for updates.
   * Pass true only after auth context and other critical initialization is complete.
   */
  isReady: boolean;
}

export type OTAUpdateState = {
  status: 'idle' | 'checking' | 'downloading' | 'available' | 'pending';
  urgency: OTAUpdateUrgency;
  criticalIndex: number;
};

function getCriticalIndexFromManifest(
  manifest?: Partial<ExpoManifestLike>,
): number {
  if (!manifest || !('extra' in manifest) || !manifest.extra) {
    return 0;
  }

  const extra = manifest.extra as {
    expoClient?: {
      extra?: OtaExtra;
    };
  };

  const maybeIndex = extra.expoClient?.extra?.ota?.criticalIndex;
  return typeof maybeIndex === 'number' && Number.isFinite(maybeIndex)
    ? maybeIndex
    : 0;
}

function resolveUpdateUrgency(
  currentManifest?: Partial<ExpoManifestLike>,
  nextManifest?: Partial<ExpoManifestLike>,
): { criticalIndex: number; urgency: OTAUpdateUrgency } {
  const currentIndex = getCriticalIndexFromManifest(currentManifest);
  const nextIndex = getCriticalIndexFromManifest(nextManifest);

  return {
    criticalIndex: nextIndex,
    urgency: nextIndex > currentIndex ? 'critical' : 'normal',
  };
}

export function useOTAUpdates({ isReady }: UseOTAUpdatesOptions) {
  const shouldReceiveUpdates = isEnabled && !__DEV__;
  const isProduction = process.env.APP_VARIANT === 'production';
  const appState = useRef<AppStateStatus>('active');
  const lastMinimize = useRef(0);
  const ranInitialCheck = useRef(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const updates = useUpdates();
  const currentManifest = updates.currentlyRunning.manifest;
  const pendingUrgency = resolveUpdateUrgency(
    currentManifest,
    updates.downloadedUpdate?.manifest,
  );
  const availableUrgency = resolveUpdateUrgency(
    currentManifest,
    updates.availableUpdate?.manifest,
  );

  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Track previous state to only log changes
  const previousState = useRef<OTAUpdateState['status']>('idle');

  // Determine update state from expo-updates
  const updateState: OTAUpdateState = useMemo(() => {
    let status: OTAUpdateState['status'] = 'idle';
    let urgency: OTAUpdateUrgency = 'normal';
    let criticalIndex = 0;

    if (updates.isUpdatePending) {
      status = 'pending';
      urgency = pendingUrgency.urgency;
      criticalIndex = pendingUrgency.criticalIndex;
    } else if (updates.isDownloading) {
      status = 'downloading';
      urgency = availableUrgency.urgency;
      criticalIndex = availableUrgency.criticalIndex;
    } else if (updates.isChecking) {
      status = 'checking';
    } else if (updates.isUpdateAvailable) {
      status = 'available';
      urgency = availableUrgency.urgency;
      criticalIndex = availableUrgency.criticalIndex;
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
          urgency,
          criticalIndex,
        },
      });
      previousState.current = status;
    }

    return { status, urgency, criticalIndex };
  }, [
    updates.isUpdatePending,
    updates.isDownloading,
    updates.isChecking,
    updates.isUpdateAvailable,
    pendingUrgency.urgency,
    pendingUrgency.criticalIndex,
    availableUrgency.urgency,
    availableUrgency.criticalIndex,
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

      countMetric('ota.check.started', {
        channel: Updates.channel || 'unknown',
        environment: isProduction ? 'production' : 'non-production',
        platform: Platform.OS,
      });

      const res = await checkForUpdateAsync();
      setLastChecked(new Date());
      const urgency = res.isAvailable
        ? resolveUpdateUrgency(currentManifest, res.manifest)
        : { urgency: 'normal' as const, criticalIndex: 0 };

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
        urgency: urgency.urgency,
        criticalIndex: urgency.criticalIndex,
      });

      if (res.isAvailable) {
        console.debug('Attempting to fetch update...');
        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'OTA update available',
          level: 'info',
          data: {
            manifestId: res.manifest?.id,
            urgency: urgency.urgency,
            criticalIndex: urgency.criticalIndex,
          },
        });

        countMetric('ota.update.available', {
          channel: Updates.channel || 'unknown',
          environment: isProduction ? 'production' : 'non-production',
          critical_index: urgency.criticalIndex,
          platform: Platform.OS,
          urgency: urgency.urgency,
        });

        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'Fetching OTA update',
          level: 'info',
        });

        await fetchUpdateAsync();

        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'OTA update fetched successfully',
          level: 'info',
        });

        countMetric('ota.update.fetched', {
          channel: Updates.channel || 'unknown',
          environment: isProduction ? 'production' : 'non-production',
          critical_index: urgency.criticalIndex,
          platform: Platform.OS,
          urgency: urgency.urgency,
        });

        sentryService.addBreadcrumb({
          category: 'ota',
          message:
            urgency.urgency === 'critical'
              ? 'Critical OTA update fetched and waiting for install'
              : 'OTA update fetched in background; will apply on next cold start',
          level: 'info',
        });
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
      console.error('OTA Update Error', { error: error.message });

      sentryService.captureException(error, {
        tags: {
          category: 'ota',
          action: 'update_check_error',
        },
        extra: {
          channel: Updates.channel || 'unknown',
          buildVersion: nativeBuildVersion,
          currentCriticalIndex: getCriticalIndexFromManifest(currentManifest),
          platform: Platform.OS,
          isProduction,
        },
      });
    }
  }, [currentManifest, isProduction]);

  const handleApply = useCallback(async () => {
    setModalVisible(false);

    sentryService.addBreadcrumb({
      category: 'ota',
      message: 'OTA update applied by user',
      level: 'info',
      data: {
        buildVersion: nativeBuildVersion,
        channel: Updates.channel || 'unknown',
        isProduction,
        platform: Platform.OS,
      },
    });

    countMetric('ota.update.applied', {
      channel: Updates.channel || 'unknown',
      environment: isProduction ? 'production' : 'non-production',
      critical_index: updateState.criticalIndex,
      method: 'manual',
      platform: Platform.OS,
      urgency: updateState.urgency,
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
  }, [isProduction, updateState.criticalIndex, updateState.urgency]);

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
      sentryService.addBreadcrumb({
        category: 'ota',
        message: 'OTA update pending - ready to apply',
        level: 'info',
        data: {
          availableUpdate: updates.availableUpdate
            ? {
                ...('id' in updates.availableUpdate
                  ? { id: String(updates.availableUpdate.id) }
                  : {}),
              }
            : null,
          buildVersion: nativeBuildVersion,
          channel: Updates.channel || 'unknown',
          criticalIndex: pendingUrgency.criticalIndex,
          isProduction,
          platform: Platform.OS,
          urgency: pendingUrgency.urgency,
        },
      });

      countMetric('ota.update.pending', {
        channel: Updates.channel || 'unknown',
        critical_index: pendingUrgency.criticalIndex,
        environment: isProduction ? 'production' : 'non-production',
        platform: Platform.OS,
        urgency: pendingUrgency.urgency,
      });

      if (pendingUrgency.urgency === 'critical') {
        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'Showing blocking install prompt for critical OTA update',
          level: 'info',
        });

        setModalVisible(true);
      } else if (!isProduction) {
        sentryService.addBreadcrumb({
          category: 'ota',
          message: 'Showing OTA update modal to user',
          level: 'info',
        });

        setModalVisible(true);
      } else {
        sentryService.addBreadcrumb({
          category: 'ota',
          message:
            'Non-critical OTA update downloaded in background; deferring install to next cold start',
          level: 'info',
        });
        setModalVisible(false);
      }
    }
  }, [
    updates.isUpdatePending,
    updates.isDownloading,
    updates.isChecking,
    updates.availableUpdate,
    isProduction,
    pendingUrgency.criticalIndex,
    pendingUrgency.urgency,
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
              if (pendingUrgency.urgency === 'critical') {
                sentryService.addBreadcrumb({
                  category: 'ota',
                  message:
                    'App foregrounded with pending critical update, showing install prompt',
                  level: 'info',
                  data: {
                    timeSinceMinimize: Date.now() - lastMinimize.current,
                    isProduction,
                  },
                });
                setModalVisible(true);
              }
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
  }, [
    updates.isUpdatePending,
    checkForUpdates,
    isReady,
    isProduction,
    pendingUrgency.urgency,
  ]);

  useEffect(() => {
    if (!isReady || !shouldReceiveUpdates) {
      return;
    }

    const interval = setInterval(() => {
      void checkForUpdates();
    }, PERIODIC_CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [checkForUpdates, isReady, shouldReceiveUpdates]);

  return {
    lastChecked,
    updateState,
    modalVisible,
    onApply: handleApply,
    onDismiss: handleDismiss,
  };
}
