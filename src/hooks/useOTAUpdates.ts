import { nativeBuildVersion } from 'expo-application';
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  setExtraParamAsync,
  useUpdates,
} from 'expo-updates';
import React, { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';

const MINIMUM_MINIMIZE_TIME = 5 * 60e3; // 5 minutes

async function setExtraParams() {
  await setExtraParamAsync(
    Platform.OS === 'ios' ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  );
  await setExtraParamAsync(
    'channel',
    // todo - fix this
    process.env.APP_VARIANT === 'production' ? 'production' : 'production',
  );
}

interface UseOTAUpdatesOptions {
  /**
   * Whether the app is ready to check for updates.
   * Pass true only after auth context and other critical initialization is complete.
   */
  isReady: boolean;
}

export function useOTAUpdates({ isReady }: UseOTAUpdatesOptions) {
  const shouldReceiveUpdates = isEnabled && !__DEV__;
  const appState = React.useRef<AppStateStatus>('active');
  const lastMinimize = React.useRef(0);
  const ranInitialCheck = React.useRef(false);
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null);
  const { isUpdatePending } = useUpdates();

  // eslint-disable-next-line no-undef
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const checkForUpdates = React.useCallback(async () => {
    try {
      await setExtraParams();

      console.debug('Checking for update...');
      const res = await checkForUpdateAsync();
      setLastChecked(new Date());

      if (res.isAvailable) {
        console.debug('Attempting to fetch update...');
        await fetchUpdateAsync();

        Alert.alert(
          'Update Available',
          'A new version of the app is available. Relaunch now?',
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Relaunch',
              style: 'default',
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onPress: async () => {
                await reloadAsync();
              },
            },
          ],
        );
      } else {
        console.debug('No update available.');
      }
    } catch (e) {
      console.error('OTA Update Error', { error: `${e}` });
    }
  }, []);

  // Initial check - only runs after app is ready
  React.useEffect(() => {
    if (!isReady || !shouldReceiveUpdates || ranInitialCheck.current) {
      return;
    }

    // Delay the initial check to ensure the app is fully rendered
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    timeout.current = setTimeout(() => {
      ranInitialCheck.current = true;
      void checkForUpdates();
    }, 10e3);

    return () => {
      clearTimeout(timeout.current);
    };
  }, [isReady, shouldReceiveUpdates, checkForUpdates]);

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
          // If it's been 5 minutes since the last "minimize", we should feel comfortable updating the client since
          // chances are that there isn't anything important going on in the current session.
          if (lastMinimize.current <= Date.now() - MINIMUM_MINIMIZE_TIME) {
            if (isUpdatePending) {
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
  }, [isUpdatePending, checkForUpdates, isReady]);

  return { lastChecked };
}
