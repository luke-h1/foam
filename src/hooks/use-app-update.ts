import { useState } from 'react';

import { toast } from 'sonner-native';

import { OTA_UPDATES_ACTIVE } from '@app/utils/app-update/constants';
import { openStore } from '@app/utils/app-update/openStore';
import { otaTelemetryFields } from '@app/utils/app-update/otaTelemetry';
import {
  checkAndFetchOtaUpdate,
  reloadIntoOtaUpdate,
} from '@app/utils/app-update/otaUpdateFlow';
import { logger } from '@app/utils/logger';

function openStorePage() {
  void openStore();
}

export function useAppUpdate() {
  const [isCheckingBundle, setIsCheckingBundle] = useState(false);

  const updateBundle = () => {
    if (isCheckingBundle) {
      return;
    }

    if (!OTA_UPDATES_ACTIVE) {
      toast.error('Over-the-air updates are not available for this build');
      return;
    }

    setIsCheckingBundle(true);
    const pendingToastId = toast.loading('Checking for updates…');

    void (async () => {
      try {
        const fetched = await checkAndFetchOtaUpdate();

        if (!fetched) {
          toast.success('You are on the latest version', {
            id: pendingToastId,
          });
          return;
        }

        toast.success('Update downloaded', {
          id: pendingToastId,
          description: 'Restart the app to apply the update',
          duration: 10_000,
          action: {
            label: 'Restart',
            onClick: () => {
              reloadIntoOtaUpdate().catch((error: unknown) => {
                logger.main.error('Manual OTA reload failed', { error });
              });
            },
          },
        });
      } catch (error) {
        logger.main.error('Manual OTA bundle update failed', {
          name: 'ota_updates_service_error',
          error: error instanceof Error ? error : new Error(String(error)),
          category: 'OTAUpdatesService',
          action: 'manual_bundle_update_failed',
          ...otaTelemetryFields(),
        });

        toast.error('Could not download update', { id: pendingToastId });
      }
    })().finally(() => {
      setIsCheckingBundle(false);
    });
  };

  return { openStore: openStorePage, updateBundle, isCheckingBundle };
}
