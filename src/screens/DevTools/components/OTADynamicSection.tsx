/* eslint-disable no-undef */
import * as Form from '@app/components/Form/Form';
import { SymbolView } from 'expo-symbols';
import { recordInfo } from '@app/lib/sentry';
import * as AC from '@bacons/apple-colors';
import * as Updates from 'expo-updates';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { ENV_SUPPORTS_OTA } from '../utils/envSupportsOta';
import { theme } from '@app/styles/themes';

const otaLoadingTitleHint = <ActivityIndicator animating />;
const otaReloadHint = (
  <SymbolView name='arrow.clockwise' tintColor={AC.secondaryLabel} />
);

const OTA_RELOAD_SCREEN_OPTIONS = {
  backgroundColor: theme.color.background.dark,
  fade: true,
  spinner: {
    color: theme.colorGreen,
    size: 'large' as const,
  },
};

async function reloadOtaWithScreen() {
  await Updates.reloadAsync({
    reloadScreenOptions: OTA_RELOAD_SCREEN_OPTIONS,
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
            if (updates.isUpdatePending) {
              recordInfo({
                name: 'ota_updates_service_info',
                message: 'OTA reload triggered from dev tools',
                params: {
                  category: 'OTAUpdatesService',
                  action: 'dev_tools_reload',
                  source: 'pending',
                  updateState: 'pending',
                },
              });
              await reloadOtaWithScreen();
            } else if (updates.isUpdateAvailable) {
              recordInfo({
                name: 'ota_updates_service_info',
                message: 'OTA check and fetch triggered from dev tools',
                params: {
                  category: 'OTAUpdatesService',
                  action: 'dev_tools_fetch',
                  source: 'available',
                  updateState: 'available',
                },
              });
              const result = await Updates.checkForUpdateAsync();
              if (result.isAvailable) {
                await Updates.fetchUpdateAsync();
                await reloadOtaWithScreen();
              }
            } else {
              recordInfo({
                name: 'ota_updates_service_info',
                message: 'OTA check triggered from dev tools',
                params: {
                  category: 'OTAUpdatesService',
                  action: 'dev_tools_check',
                  source: 'idle',
                  updateState: 'idle',
                },
              });
              const result = await Updates.checkForUpdateAsync();
              if (result.isAvailable) {
                await Updates.fetchUpdateAsync();
                await reloadOtaWithScreen();
              }
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
