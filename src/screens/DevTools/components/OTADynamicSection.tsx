/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-undef */
import * as Form from '@app/components/Form/Form';
import { IconSymbol } from '@app/components/IconSymbol/IconSymbol';
import * as AC from '@bacons/apple-colors';
import * as Updates from 'expo-updates';
import { ActivityIndicator, View } from 'react-native';
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
    if (updates.isUpdateAvailable) {
      return 'Reload app';
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
  return (
    <Form.Section
      title={
        !updates.availableUpdate ? 'Synchronized ✓' : 'Needs synchronization'
      }
      titleHint={isLoading ? <ActivityIndicator animating /> : lastCheckTime}
    >
      <Form.Text
        style={{
          color:
            updates.availableUpdate || !isLoading ? AC.systemBlue : AC.label,
        }}
        onPress={() => {
          if (__DEV__ && !ENV_SUPPORTS_OTA) {
            // eslint-disable-next-line no-alert
            alert('OTA updates are not available in the Expo Go app.');
            return;
          }
          if (updates.availableUpdate) {
            void Updates.reloadAsync();
          } else {
            void Updates.checkForUpdateAsync();
          }
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
        <Form.HStack style={{ flexWrap: 'wrap' }}>
          <Form.Text style={{ color: AC.systemRed }}>
            Error checking status
          </Form.Text>
          <View style={{ flex: 1 }} />
          <Form.Text style={{ flexShrink: 1, color: AC.secondaryLabel }}>
            {checkError.message}
          </Form.Text>
        </Form.HStack>
      )}
    </Form.Section>
  );
}
