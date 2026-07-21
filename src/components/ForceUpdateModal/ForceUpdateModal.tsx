import {
  Modal as RNModal,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Application from 'expo-application';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { getStoreUrlAsync } from '@app/screens/DevTools/util/getStoreUrlAsync';
import { type ColorScheme, theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { isUpdateRequired } from '@app/utils/version/compareVersions';
import { getMinimumVersion } from '@app/utils/version/getMinimumVersion';

import { Variant } from '../../../app.config';
import { Button } from '../Button/Button';

async function handleUpdatePress(scheme: ColorScheme) {
  const storeUrl = await getStoreUrlAsync();
  if (storeUrl) {
    openLinkInBrowser(storeUrl, scheme);
  }
}

export function ForceUpdateModal() {
  const { config: remoteConfig } = useRemoteConfig();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  const variant = (process.env.EXPO_PUBLIC_APP_VARIANT ??
    'development') as Variant;
  const minimumVersion = getMinimumVersion(variant, remoteConfig);
  const currentVersion = Application.nativeApplicationVersion ?? 'Unknown';

  const updateRequired =
    minimumVersion && currentVersion && currentVersion !== 'Unknown'
      ? (isUpdateRequired(currentVersion, minimumVersion) ?? false)
      : false;

  return (
    <RNModal
      animationType='fade'
      transparent
      visible={updateRequired}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.color.backgroundAlt[scheme],
              borderColor: theme.color.border[scheme],
            },
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.color.accent[scheme] },
            ]}
          >
            <SymbolView name='arrow.up' />
          </View>

          <Text color='gray' type='xl' weight='bold' align='center'>
            Update Required
          </Text>

          <Text
            color='gray.textLow'
            type='sm'
            align='left'
            style={styles.subtitle}
          >
            A new version of Foam is available. Please update to continue using
            the app.
          </Text>

          <View
            style={[
              styles.versionInfo,
              { backgroundColor: theme.color.backgroundSecondary[scheme] },
            ]}
          >
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
            onPress={() => void handleUpdatePress(scheme)}
            style={[
              styles.updateButton,
              { backgroundColor: theme.color.accent[scheme] },
            ]}
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
    borderRadius: theme.borderRadius34,
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    justifyContent: 'center' as const,
    paddingVertical: theme.space16,
    width: '100%',
  },
  versionInfo: {
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
