import {
  RemoteConfigType,
  useRemoteConfig,
} from '@app/hooks/firebase/useRemoteConfig';
import { getStoreUrlAsync } from '@app/screens/DevTools/utils/getStoreUrlAsync';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { isUpdateRequired } from '@app/utils/version/compareVersions';
import * as Application from 'expo-application';
import { useCallback } from 'react';
import { Modal as RNModal, Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Variant } from '../../../app.config';
import { Button } from '../Button/Button';
import { IconSymbol } from '../IconSymbol/IconSymbol';
import { Text } from '../Text/Text';

function getMinimumVersion(variant: Variant, remoteConfig: RemoteConfigType) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const platformConfig = remoteConfig.minimumVersion.value[platform];

  switch (variant) {
    case 'development':
      return platformConfig?.development ?? '';
    case 'production':
      return platformConfig?.production ?? '';
    case 'preview':
      return platformConfig?.preview ?? '';
    default:
      return '';
  }
}

export function ForceUpdateModal() {
  const { config: remoteConfig } = useRemoteConfig();
  const insets = useSafeAreaInsets();

  const variant = (process.env.APP_VARIANT ?? 'development') as Variant;
  const minimumVersion = getMinimumVersion(variant, remoteConfig);
  const currentVersion = Application.nativeApplicationVersion ?? 'Unknown';

  const updateRequired =
    minimumVersion && currentVersion && currentVersion !== 'Unknown'
      ? (isUpdateRequired(currentVersion, minimumVersion) ?? false)
      : false;

  const handleUpdatePress = useCallback(async () => {
    const storeUrl = await getStoreUrlAsync();
    if (storeUrl) {
      openLinkInBrowser(storeUrl);
    }
  }, []);

  return (
    <RNModal
      animationType="fade"
      transparent
      visible={updateRequired}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <IconSymbol name="arrow.up" />
          </View>

          <Text color="gray" type="xl" weight="bold" align="center">
            Update Required
          </Text>

          <Text
            color="gray.textLow"
            type="sm"
            align="left"
            style={styles.subtitle}
          >
            A new version of Foam is available. Please update to continue using
            the app.
          </Text>

          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Text color="gray.textLow" type="xs">
                Current version
              </Text>
              <Text color="gray" type="xs" weight="semibold">
                {currentVersion}
              </Text>
            </View>
            <View style={styles.versionRow}>
              <Text color="gray.textLow" type="xs">
                Minimum required
              </Text>
              <Text color="gray" type="xs" weight="semibold">
                {minimumVersion}
              </Text>
            </View>
          </View>

          <Button
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={handleUpdatePress}
            style={styles.updateButton}
          >
            <Text color="accent" contrast type="md" weight="semibold">
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
    backgroundColor: theme.colors.gray.bgAlt,
    borderColor: theme.colors.gray.border,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    maxWidth: 340,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center' as const,
    backgroundColor: theme.colors.accent.ui,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center' as const,
    marginBottom: theme.spacing.lg,
    width: 72,
  },
  overlay: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: theme.spacing.lg,
  },
  subtitle: {
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  updateButton: {
    alignItems: 'center' as const,
    backgroundColor: theme.colors.accent.accent,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    justifyContent: 'center' as const,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  versionInfo: {
    backgroundColor: theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    width: '100%',
  },
  versionRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
});
