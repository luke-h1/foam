import { useState } from 'react';
import { Platform } from 'react-native';

import type { ReloadScreenOptions } from 'expo-updates';
import * as Updates from 'expo-updates';
import { toast } from 'sonner-native';

import { ENV_SUPPORTS_OTA } from '@app/screens/DevTools/util/envSupportsOta';
import { getStoreUrlAsync } from '@app/screens/DevTools/util/getStoreUrlAsync';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { logger } from '@app/utils/logger';

const OTA_RELOAD_SCREEN_OPTIONS = {
  backgroundColor: theme.color.background.dark,
  fade: true,
  spinner: {
    color: theme.colorPrimary,
    size: 'large' as const,
  },
} satisfies ReloadScreenOptions;

function openStore() {
  void (async () => {
    const storeUrl = await getStoreUrlAsync();
    if (storeUrl) {
      openLinkInBrowser(storeUrl);
      return;
    }
    toast.error('Could not open the store');
  })();
}

export function useAppUpdate() {
  const [isCheckingBundle, setIsCheckingBundle] = useState(false);

  const updateBundle = () => {
    if (isCheckingBundle) {
      return;
    }
    if (!ENV_SUPPORTS_OTA) {
      toast.error('Over-the-air updates are not available for this build');
      return;
    }

    setIsCheckingBundle(true);
    const pendingToastId = toast.loading('Checking for updates…');

    void (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) {
          toast.success('You are on the latest version', {
            id: pendingToastId,
          });
          return;
        }

        await Updates.fetchUpdateAsync();
        toast.success('Update downloaded', {
          id: pendingToastId,
          description: 'Restart the app to apply the update',
          duration: 10000,
          action: {
            label: 'Restart',
            onClick: () => {
              void Updates.reloadAsync({
                reloadScreenOptions: OTA_RELOAD_SCREEN_OPTIONS,
              });
            },
          },
        });
      } catch (caught) {
        const error =
          caught instanceof Error ? caught : new Error(String(caught));
        logger.main.error('Manual OTA bundle update failed', {
          name: 'ota_updates_service_error',
          error,
          category: 'OTAUpdatesService',
          action: 'manual_bundle_update_failed',
          channel: Updates.channel || 'unknown',
          platform: Platform.OS,
        });
        toast.error('Could not download update', { id: pendingToastId });
      }
    })().finally(() => {
      setIsCheckingBundle(false);
    });
  };

  return { openStore, updateBundle, isCheckingBundle };
}
