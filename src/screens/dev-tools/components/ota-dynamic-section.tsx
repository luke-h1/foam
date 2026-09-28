/* eslint-disable no-undef */
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import * as AC from '@bacons/apple-colors';
import type { ReloadScreenOptions } from 'expo-updates';
import * as Updates from 'expo-updates';

import * as Form from '@app/components/form/form';
import { SymbolView } from '@app/components/ui/icon/icon';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

import { ENV_SUPPORTS_OTA } from '../util/env-supports-ota';

const otaLoadingTitleHint = <ActivityIndicator animating />;

const otaReloadHint = (
  <SymbolView name='arrow.clockwise' tintColor={AC.secondaryLabel} />
);

const OTA_RELOAD_SCREEN_OPTIONS = {
  backgroundColor: theme.color.background.dark,
  fade: true,
  spinner: {
    color: theme.colorPrimary,
    size: 'large' as const,
  },
} satisfies ReloadScreenOptions;

async function reloadOtaWithScreen() {
  await Updates.reloadAsync({
    reloadScreenOptions: OTA_RELOAD_SCREEN_OPTIONS,
  });
}

/**
 * Records which of the three OTA states the dev-tools button acted on.
 */
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
  const state = updates.isUpdatePending
    ? 'pending'
    : updates.isUpdateAvailable
      ? 'available'
      : 'idle';

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
          if (__DEV__ && !ENV_SUPPORTS_OTA) {
            // eslint-disable-next-line no-alert
            alert('OTA updates are not available in the Expo Go app.');
            return;
          }

          void (async () => {
            logOtaDevToolsAction(updates);

            if (updates.isUpdatePending) {
              await reloadOtaWithScreen();
              return;
            }

            const result = await Updates.checkForUpdateAsync();

            if (!result.isAvailable) {
              return;
            }

            await Updates.fetchUpdateAsync();
            await reloadOtaWithScreen();
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
