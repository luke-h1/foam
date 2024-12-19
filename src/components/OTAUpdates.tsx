import { useState } from 'react';
import * as Updates from 'expo-updates';
import { reportCrash } from '@app/utils/reportCrash';
import useAppState from '@app/hooks/useAppState';

export default function OTAUpdates() {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  async function fetchAndRestartApp() {
    const fetchUpdate = await Updates.fetchUpdateAsync();

    if (fetchUpdate.isNew) {
      await Updates.reloadAsync();
    } else {
      setModalVisible(false);
      setUpdating(false);
      reportCrash('Fetch update failed');
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
      reportCrash(error);
    }
  }

  useAppState({
    match: /background/,
    nextAppState: 'active',
    callback: onFetchUpdateAsync,
  });

  return (
    <Modal
  )
}
