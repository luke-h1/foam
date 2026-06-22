import {
  RemoteConfigType,
  useRemoteConfig,
} from '@app/hooks/firebase/useRemoteConfig';
import { getStoreUrlAsync } from '@app/screens/DevTools/util/getStoreUrlAsync';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { isUpdateRequired } from '@app/utils/version/compareVersions';
import * as Application from 'expo-application';
import { Modal as RNModal, Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Variant } from '../../../app.config';
import { Button } from '../Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';

function getMinimumVersion(variant: Variant, remoteConfig: RemoteConfigType) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const platformConfig = remoteConfig.minimumVersion.value[platform];

  switch (variant) {
    case 'development':
      return platformConfig?.development ?? '';
    case 'internal':
      return platformConfig?.internal ?? '';
    case 'testflight':
      return platformConfig?.testflight ?? '';
    case 'production':
      return platformConfig?.production ?? '';
    default:
      return '';
  }
}

async function handleUpdatePress() {
  const storeUrl = await getStoreUrlAsync();
  if (storeUrl) {
    openLinkInBrowser(storeUrl);
  }
}

export function ForceUpdateModal() {
  const { config: remoteConfig } = useRemoteConfig();
  const insets = useSafeAreaInsets();

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
        <View style={styles.card}>
          <View style={styles.iconContainer}>
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
