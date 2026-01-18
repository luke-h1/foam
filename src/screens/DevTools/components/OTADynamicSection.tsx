/* eslint-disable no-undef */
import * as Form from '@app/components/Form/Form';
import { IconSymbol } from '@app/components/IconSymbol/IconSymbol';
import { sentryService } from '@app/services/sentry-service';
import * as AC from '@bacons/apple-colors';
import * as Updates from 'expo-updates';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ENV_SUPPORTS_OTA } from '../utils/envSupportsOta';

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
      titleHint={isLoading ? <ActivityIndicator animating /> : lastCheckTime}
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
              // Update is ready, reload immediately
              sentryService.captureMessage('OTA reload triggered from dev tools', {
                level: 'info',
                tags: {
                  category: 'ota',
                  action: 'dev_tools_reload',
                  source: 'pending',
                },
              });
              await Updates.reloadAsync();
            } else if (updates.isUpdateAvailable) {
              // Update is available but not fetched, fetch it first
              sentryService.captureMessage(
                'OTA check and fetch triggered from dev tools',
                {
                  level: 'info',
                  tags: {
                    category: 'ota',
                    action: 'dev_tools_fetch',
                    source: 'available',
                  },
                },
              );
              const result = await Updates.checkForUpdateAsync();
              if (result.isAvailable) {
                await Updates.fetchUpdateAsync();
                // After fetch, it should become pending, reload
                await Updates.reloadAsync();
              }
            } else {
              // Check for updates
              sentryService.captureMessage('OTA check triggered from dev tools', {
                level: 'info',
                tags: {
                  category: 'ota',
                  action: 'dev_tools_check',
                  source: 'idle',
                },
              });
              const result = await Updates.checkForUpdateAsync();
              if (result.isAvailable) {
                await Updates.fetchUpdateAsync();
                // After fetch, reload
                await Updates.reloadAsync();
              }
            }
          })();
        }}
        hint={
          isLoading ? (
            <ActivityIndicator animating />
          ) : (
            <IconSymbol name="arrow.clockwise" color={AC.secondaryLabel} />
          )
        }
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

const styles = StyleSheet.create(() => ({
  errorContainer: {
    flexWrap: 'wrap',
  },
  errorText: {
    color: AC.systemRed,
  },
  spacer: {
    flex: 1,
  },
  errorMessage: {
    flexShrink: 1,
    color: AC.secondaryLabel,
  },
}));
