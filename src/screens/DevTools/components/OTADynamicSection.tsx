/* eslint-disable no-undef */
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import * as AC from '@bacons/apple-colors';
import type { ReloadScreenOptions } from 'expo-updates';
import * as Updates from 'expo-updates';

import * as Form from '@app/components/Form/Form';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { drainInFlightExpoFetches } from '@app/lib/expoFetch';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

import { ENV_SUPPORTS_OTA } from '../util/envSupportsOta';

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
  await drainInFlightExpoFetches();
  await Updates.reloadAsync({
    reloadScreenOptions: OTA_RELOAD_SCREEN_OPTIONS,
  });
}

export function OTADynamicSection() {
  const { t } = useTranslation('devTools');
  const updates = Updates.useUpdates();

  const fetchingTitle = (() => {
    if (updates.isDownloading) {
      return t('downloading');
    }
    if (updates.isChecking) {
      return t('checkingForUpdates');
    }
    if (updates.isUpdatePending) {
      return t('reloadApp');
    }
    if (updates.isUpdateAvailable) {
      return t('downloadAndReload');
    }
    return t('checkAgain');
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
          ? t('synchronized')
          : t('needsSynchronization')
      }
      titleHint={isLoading ? otaLoadingTitleHint : lastCheckTime}
    >
      <Form.Text
        style={{ color: textColor }}
        onPress={() => {
          if (__DEV__ && !ENV_SUPPORTS_OTA) {
            // eslint-disable-next-line no-alert
            alert(t('otaUnavailableInExpoGo'));
            return;
          }
          void (async () => {
            if (updates.isUpdatePending) {
              logger.main.info('OTA reload triggered from dev tools', {
                name: 'ota_updates_service_info',
                category: 'OTAUpdatesService',
                action: 'dev_tools_reload',
                source: 'pending',
                updateState: 'pending',
              });
              await reloadOtaWithScreen();
            } else if (updates.isUpdateAvailable) {
              logger.main.info('OTA check and fetch triggered from dev tools', {
                name: 'ota_updates_service_info',
                category: 'OTAUpdatesService',
                action: 'dev_tools_fetch',
                source: 'available',
                updateState: 'available',
              });
              const result = await Updates.checkForUpdateAsync();
              if (result.isAvailable) {
                await Updates.fetchUpdateAsync();
                await reloadOtaWithScreen();
              }
            } else {
              logger.main.info('OTA check triggered from dev tools', {
                name: 'ota_updates_service_info',
                category: 'OTAUpdatesService',
                action: 'dev_tools_check',
                source: 'idle',
                updateState: 'idle',
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
          <Form.Text style={styles.errorText}>
            {t('errorCheckingStatus')}
          </Form.Text>
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
