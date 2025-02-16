import { useAppState } from '@app/hooks';
import { reportCrash } from '@app/utils/reportCrash';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { Modal } from '../Modal';

export function OTAUpdates() {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  async function fetchAndRestartApp() {
    const { isNew } = await Updates.fetchUpdateAsync();

    if (isNew) {
      await Updates.reloadAsync();
    } else {
      setModalVisible(false);
      setUpdating(false);
      reportCrash({
        message: 'Update failed',
        name: 'OTAUpdatedFailed',
      });
    }
  }

  async function onFetchUpdateAsync() {
    if (__DEV__ || process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-useless-return
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      setModalVisible(update.isAvailable);
    } catch (error) {
      reportCrash({
        message: `Failed to check for updates ${error}`,
        name: 'OTAUpdatedFailedToCheckForUpdate',
      });
    }
  }

  useAppState({
    match: /background/,
    nextAppState: 'active',
    callback: onFetchUpdateAsync,
  });

  return (
    <Modal
      title="Update available"
      subtitle="New update available. Install to get the latest features and bugfixes"
      confirmOnPress={{
        cta: async () => {
          setUpdating(true);
          await fetchAndRestartApp();
        },
        label: updating ? 'Updating...' : 'Update',
        disabled: updating,
      }}
      cancelOnPress={{
        cta: () => {
          setModalVisible(false);
        },
        label: 'Defer',
      }}
      isVisible={modalVisible}
    />
  );
}
