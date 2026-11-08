import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';

import { openStore } from '@app/utils/app-update/openStore';

import { UPDATE_REQUIRED_BODY, UPDATE_REQUIRED_TITLE } from './constants';
import { useArmedWhenIdle } from './hooks/use-armed-when-idle';
import { useUpdateRequirement } from './hooks/use-update-requirement';

const ALERT_REPRESENT_DELAY_MS = 300;

export function ForceUpdateModal() {
  const armed = useArmedWhenIdle();

  return armed ? <ForceUpdateAlert /> : null;
}

function ForceUpdateAlert() {
  const { updateRequired, currentVersion, minimumVersion } =
    useUpdateRequirement();

  const alertVisibleRef = useRef(false);

  useEffect(() => {
    if (!updateRequired) {
      return;
    }

    let alertTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleAlert = () => {
      if (alertTimer) {
        clearTimeout(alertTimer);
      }

      alertTimer = setTimeout(presentAlert, ALERT_REPRESENT_DELAY_MS);
    };

    const presentAlert = () => {
      if (alertVisibleRef.current) {
        return;
      }

      alertVisibleRef.current = true;

      Alert.alert(
        UPDATE_REQUIRED_TITLE,
        `${UPDATE_REQUIRED_BODY}\n\nCurrent version: ${currentVersion}\nMinimum required: ${minimumVersion}`,
        [
          {
            text: 'Update',
            onPress: () => {
              alertVisibleRef.current = false;
              void openStore().then(scheduleAlert);
            },
          },
        ],
      );
    };

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        scheduleAlert();
      }
    });

    if (AppState.currentState === 'active') {
      presentAlert();
    }

    return () => {
      appStateSubscription.remove();
      alertVisibleRef.current = false;

      if (alertTimer) {
        clearTimeout(alertTimer);
      }
    };
  }, [updateRequired, currentVersion, minimumVersion]);

  return null;
}
