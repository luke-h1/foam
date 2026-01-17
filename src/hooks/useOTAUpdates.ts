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

  // eslint-disable-next-line no-undef
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Determine update state from expo-updates
  const updateState: OTAUpdateState = useMemo(() => {
    if (updates.isUpdatePending) {
      return { status: 'pending' };
    }
    if (updates.isDownloading) {
      return { status: 'downloading' };
    }
    if (updates.isChecking) {
      return { status: 'checking' };
    }
    if (updates.isUpdateAvailable) {
      return { status: 'available' };
    }
    return { status: 'idle' };
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
      const res = await checkForUpdateAsync();
      setLastChecked(new Date());

      if (res.isAvailable) {
        console.debug('Attempting to fetch update...');
        await fetchUpdateAsync();
        // Modal will be shown by the useEffect that watches isUpdatePending
      } else {
        console.debug('No update available.');
      }
    } catch (e) {
      console.error('OTA Update Error', { error: `${e}` });
    }
  }, []);

  const handleApply = useCallback(async () => {
    setModalVisible(false);
    await reloadAsync();
  }, []);

  const handleDismiss = useCallback(() => {
    setModalVisible(false);
  }, []);

  // Initial check - only runs after app is ready
  useEffect(() => {
    if (!isReady || !shouldReceiveUpdates || ranInitialCheck.current) {
      return;
    }

    // In production, run immediately; otherwise delay to ensure the app is fully rendered
    if (isProduction) {
      ranInitialCheck.current = true;
      void checkForUpdates();
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      timeout.current = setTimeout(() => {
        ranInitialCheck.current = true;
        void checkForUpdates();
      }, 10e3);
    }

    return () => {
      clearTimeout(timeout.current);
    };
  }, [isReady, shouldReceiveUpdates, checkForUpdates, isProduction]);

  // Show modal when update becomes pending
  useEffect(() => {
    if (
      updates.isUpdatePending &&
      !updates.isDownloading &&
      !updates.isChecking
    ) {
      setModalVisible(true);
    }
  }, [updates.isUpdatePending, updates.isDownloading, updates.isChecking]);

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
              await reloadAsync();
            } else {
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
