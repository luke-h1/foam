import { ActivityIndicator, StyleSheet, View } from 'react-native';

import * as AC from '@bacons/apple-colors';
import * as Updates from 'expo-updates';

import * as Form from '@app/components/form/Form';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { OTA_UPDATES_ACTIVE } from '@app/utils/app-update/constants';
import {
  checkAndFetchOtaUpdate,
  reloadIntoOtaUpdate,
} from '@app/utils/app-update/otaUpdateFlow';
import { logger } from '@app/utils/logger';

const otaLoadingTitleHint = <ActivityIndicator animating />;

const otaReloadHint = (
  <SymbolView name='arrow.clockwise' tintColor={AC.secondaryLabel} />
);

const OTA_DEV_TOOLS_ACTIONS = {
  pending: {
    action: 'dev_tools_reload',
    message: 'OTA reload triggered from dev tools',
  },
  available: {
    action: 'dev_tools_fetch',
    message: 'OTA check and fetch triggered from dev tools',
  },
  idle: {
    action: 'dev_tools_check',
    message: 'OTA check triggered from dev tools',
  },
} as const;

function logOtaDevToolsAction(updates: {
  isUpdatePending: boolean;
  isUpdateAvailable: boolean;
}): void {
  let state: keyof typeof OTA_DEV_TOOLS_ACTIONS = 'idle';

  if (updates.isUpdatePending) {
    state = 'pending';
  } else if (updates.isUpdateAvailable) {
    state = 'available';
  }

  const { action, message } = OTA_DEV_TOOLS_ACTIONS[state];

  logger.main.info(message, {
    name: 'ota_updates_service_info',
    category: 'OTAUpdatesService',
    action,
    source: state,
    updateState: state,
  });
}

export function OTADynamicSection() {
  const updates = Updates.useUpdates();

  const fetchingTitle = (() => {
    if (updates.isDownloading) {
      return 'Downloading...';
    }

    if (updates.isChecking) {
      return 'Checking for updates...';
    }

    if (updates.isUpdatePending) {
      return 'Reload app';
    }

    if (updates.isUpdateAvailable) {
      return 'Download & reload';
    }

    return 'Check again';
  })();

  const { checkError } = updates;

  const lastCheckTime = (
    updates.lastCheckForUpdateTimeSinceRestart
      ? new Date(updates.lastCheckForUpdateTimeSinceRestart)
      : new Date()
  ).toLocaleString('en-gb', {
    timeZoneName: 'short',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  if (process.env.EXPO_OS === 'web') {
    return null;
  }

  const isLoading = updates.isChecking || updates.isDownloading;

  const textColor =
    updates.isUpdatePending || updates.isUpdateAvailable || !isLoading
      ? AC.systemBlue
      : AC.label;

  return (
    <Form.Section
      title={
        !updates.isUpdatePending && !updates.isUpdateAvailable
          ? 'Synchronized ✓'
          : 'Needs synchronization'
      }
      titleHint={isLoading ? otaLoadingTitleHint : lastCheckTime}
    >
      <Form.Text
        style={{ color: textColor }}
        onPress={() => {
          if (!OTA_UPDATES_ACTIVE) {
            alert('OTA updates are not available in this build.');
            return;
          }

          void (async () => {
            logOtaDevToolsAction(updates);

            if (updates.isUpdatePending) {
              await reloadIntoOtaUpdate();
              return;
            }

            if (await checkAndFetchOtaUpdate()) {
              await reloadIntoOtaUpdate();
            }
          })();
        }}
        hint={isLoading ? otaLoadingTitleHint : otaReloadHint}
      >
        {fetchingTitle}
      </Form.Text>
      {checkError && (
        <Form.HStack style={styles.errorContainer}>
          <Form.Text style={styles.errorText}>Error checking status</Form.Text>
          <View style={styles.spacer} />
          <Form.Text style={styles.errorMessage}>
            {checkError.message}
          </Form.Text>
        </Form.HStack>
      )}
    </Form.Section>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flexWrap: 'wrap',
  },
  errorMessage: {
    color: AC.secondaryLabel,
    flexShrink: 1,
  },
  errorText: {
    color: AC.systemRed,
  },
  spacer: {
    flex: 1,
  },
});
