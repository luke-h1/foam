import { AppState, Linking } from 'react-native';

import * as WebBrowser from 'expo-web-browser';

import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

function waitForAppToReturnToForeground() {
  let leftForeground = AppState.currentState !== 'active';
  let subscription: ReturnType<typeof AppState.addEventListener> | undefined;

  const promise = new Promise<void>(resolve => {
    subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        leftForeground = true;
        return;
      }

      if (leftForeground) {
        subscription?.remove();
        resolve();
      }
    });
  });

  return {
    cancel: () => subscription?.remove(),
    promise,
  };
}

export async function openLinkInBrowserAsync(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      controlsColor: theme.colorPrimary,
      createTask: false,
      dismissButtonStyle: 'close',
      enableBarCollapsing: true,
      showTitle: true,
      toolbarColor: theme.color.background.dark,
    });
  } catch {
    const appReturn = waitForAppToReturnToForeground();
    try {
      await Linking.openURL(url);
      await appReturn.promise;
    } catch (error) {
      appReturn.cancel();
      throw error;
    }
  }
}

export function openLinkInBrowser(url: string) {
  openLinkInBrowserAsync(url).catch(error => {
    logger.main.error('[openLinkInBrowser] failed to open link', error);
  });
}
