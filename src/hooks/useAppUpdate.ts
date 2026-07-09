import { useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

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

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useAppUpdate() {
  const { t } = useTranslation('settings');
  const [isCheckingBundle, setIsCheckingBundle] = useState(false);

  const openStore = () => {
    void (async () => {
      const storeUrl = await getStoreUrlAsync();
      if (storeUrl) {
        openLinkInBrowser(storeUrl);
        return;
      }
      toast.error(t('updateStoreUnavailable'));
    })();
  };

  const updateBundle = () => {
    if (isCheckingBundle) {
      return;
    }
    if (!ENV_SUPPORTS_OTA) {
      toast.error(t('otaUnavailable'));
      return;
    }

    setIsCheckingBundle(true);
    const pendingToastId = toast.loading(t('bundleChecking'));

    void (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) {
          toast.success(t('bundleUpToDate'), { id: pendingToastId });
          return;
        }

        await Updates.fetchUpdateAsync();
        toast.success(t('bundleDownloaded'), {
          id: pendingToastId,
          description: t('bundleDownloadedDescription'),
          duration: 10000,
          action: {
            label: t('bundleRestart'),
            onClick: () => {
              void Updates.reloadAsync({
                reloadScreenOptions: OTA_RELOAD_SCREEN_OPTIONS,
              });
            },
          },
        });
      } catch (error) {
        logger.main.error('Manual OTA bundle update failed', {
          name: 'ota_updates_service_error',
          error: toError(error),
          category: 'OTAUpdatesService',
          action: 'manual_bundle_update_failed',
          channel: Updates.channel || 'unknown',
          platform: Platform.OS,
        });
        toast.error(t('bundleUpdateFailed'), { id: pendingToastId });
      } finally {
        setIsCheckingBundle(false);
      }
    })();
  };

  return { openStore, updateBundle, isCheckingBundle };
}
