import { useEffect, useRef } from 'react';
import {
  Alert,
  AppState,
  Modal as RNModal,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Application from 'expo-application';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { getStoreUrlAsync } from '@app/screens/DevTools/util/getStoreUrlAsync';
import { theme } from '@app/styles/themes';
import { openLinkInBrowserAsync } from '@app/utils/browser/openLinkInBrowser';
import { logger } from '@app/utils/logger';
import { isUpdateRequired } from '@app/utils/version/compareVersions';
import { getMinimumVersion } from '@app/utils/version/getMinimumVersion';

import { Button } from '../Button/Button';

async function handleUpdatePress() {
  try {
    const storeUrl = await getStoreUrlAsync();
    if (storeUrl) {
      await openLinkInBrowserAsync(storeUrl);
    }
  } catch (error) {
    logger.main.error('[ForceUpdateModal] failed to open store link', error);
  }
}

const UPDATE_REQUIRED_TITLE = 'Update Required';
const UPDATE_REQUIRED_BODY =
  'A new version of Foam is available. Please update to continue using the app.';
const ALERT_REPRESENT_DELAY_MS = 300;

export function ForceUpdateModal() {
  const { config: remoteConfig } = useRemoteConfig();
  const insets = useSafeAreaInsets();
  const alertVisibleRef = useRef(false);

  const variant = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';
  const minimumVersion = getMinimumVersion(variant, remoteConfig);
  const currentVersion = Application.nativeApplicationVersion ?? 'Unknown';

  const updateRequired =
    minimumVersion && currentVersion && currentVersion !== 'Unknown'
      ? (isUpdateRequired(currentVersion, minimumVersion) ?? false)
      : false;

  useEffect(() => {
    if (Platform.OS !== 'ios' || !updateRequired) {
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
              void handleUpdatePress().finally(scheduleAlert);
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

  if (Platform.OS === 'ios') {
    return null;
  }

  return (
    <RNModal
      animationType='fade'
      transparent
      visible={updateRequired}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <SymbolView name='arrow.up' />
          </View>

          <Text
            color='gray'
            type='xl'
            weight='bold'
            align='center'
            family='system'
          >
            {UPDATE_REQUIRED_TITLE}
          </Text>

          <Text
            color='gray.textLow'
            family='system'
            type='sm'
            align='left'
            style={styles.subtitle}
          >
            {UPDATE_REQUIRED_BODY}
          </Text>

          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Text color='gray.textLow' type='xs'>
                Current version
              </Text>
              <Text color='gray' type='xs' weight='semibold'>
                {currentVersion}
              </Text>
            </View>
            <View style={styles.versionRow}>
              <Text color='gray.textLow' type='xs'>
                Minimum required
              </Text>
              <Text color='gray' type='xs' weight='semibold'>
                {minimumVersion}
              </Text>
            </View>
          </View>

          <Button
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={handleUpdatePress}
            style={styles.updateButton}
          >
            <Text color='accent' contrast type='md' weight='semibold'>
              Update Now
            </Text>
          </Button>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center' as const,
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    maxWidth: 340,
    paddingHorizontal: theme.space28,
    paddingVertical: theme.space28,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center' as const,
    backgroundColor: theme.colorPrimary,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center' as const,
    marginBottom: theme.space20,
    width: 72,
  },
  overlay: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: theme.space20,
  },
  subtitle: {
    lineHeight: 20,
    marginBottom: theme.space20,
    marginTop: theme.space12,
  },
  updateButton: {
    alignItems: 'center' as const,
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    justifyContent: 'center' as const,
    paddingVertical: theme.space16,
    width: '100%',
  },
  versionInfo: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    gap: theme.space8,
    marginBottom: theme.space20,
    padding: theme.space16,
    width: '100%',
  },
  versionRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
});
