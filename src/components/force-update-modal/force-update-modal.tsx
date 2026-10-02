import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  InteractionManager,
  Modal as RNModal,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Application from 'expo-application';

import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';
import { getStoreUrlAsync } from '@app/screens/dev-tools/util/get-store-url-async';
import { theme } from '@app/styles/themes';
import { openLinkInBrowserAsync } from '@app/utils/browser/open-link-in-browser';
import { logger } from '@app/utils/logger';
import { isUpdateRequired } from '@app/utils/version/compare-versions';
import { getMinimumVersion } from '@app/utils/version/get-minimum-version';

import { ActionButton } from '../action-button/action-button';

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

/**
 * Mounted after first interactions to keep the Remote Config fetch off the
 * first frame.
 */
export function ForceUpdateModal() {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void InteractionManager.runAfterInteractions(() => {
      if (!cancelled) {
        setArmed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return armed ? <ForceUpdateModalContent /> : null;
}

function ForceUpdateModalContent() {
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
          <SymbolView
            name='arrow.down.app'
            size={44}
            tintColor={theme.color.accent.dark}
          />

          <Text type='title3' align='center' style={styles.title}>
            {UPDATE_REQUIRED_TITLE}
          </Text>

          <Text
            color='gray.textLow'
            type='subhead'
            align='center'
            style={styles.subtitle}
          >
            {UPDATE_REQUIRED_BODY}
          </Text>

          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Text color='gray.textLow' type='subhead'>
                Current version
              </Text>
              <Text type='subhead' weight='semibold' tabular>
                {currentVersion}
              </Text>
            </View>
            <View style={styles.versionRow}>
              <Text color='gray.textLow' type='subhead'>
                Minimum required
              </Text>
              <Text type='subhead' weight='semibold' tabular>
                {minimumVersion}
              </Text>
            </View>
          </View>

          <ActionButton
            title='Update now'
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={handleUpdatePress}
            style={styles.updateButton}
          />
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.color.surface.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.xl,
    maxWidth: 340,
    padding: theme.space28,
    width: '100%',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: theme.color.scrimStrong.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
  title: {
    marginTop: theme.space16,
  },
  subtitle: {
    marginBottom: theme.space20,
    marginTop: theme.space8,
  },
  updateButton: {
    alignSelf: 'stretch',
  },
  versionInfo: {
    alignSelf: 'stretch',
    gap: theme.space8,
    marginBottom: theme.space24,
  },
  versionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
