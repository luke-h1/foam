import { getStoreUrlAsync } from '@app/screens/DevTools/utils/getStoreUrlAsync';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import * as Application from 'expo-application';
import { useState } from 'react';
import { Modal as RNModal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { IconSymbol } from '../IconSymbol/IconSymbol';
import { Typography } from '../Typography';

interface ForceUpdateModalProps {
  isVisible: boolean;
  minimumVersion: string;
}

export function ForceUpdateModal({
  isVisible,
  minimumVersion,
}: ForceUpdateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleUpdatePress = async () => {
    setIsLoading(true);
    try {
      const storeUrl = await getStoreUrlAsync();
      if (storeUrl) {
        openLinkInBrowser(storeUrl);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentVersion = Application.nativeApplicationVersion ?? 'Unknown';

  return (
    <RNModal
      animationType="fade"
      transparent
      visible={isVisible}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <IconSymbol name="arrow.up" />
          </View>

          <Typography color="gray" size="xl" fontWeight="bold" align="center">
            Update Required
          </Typography>

          <Typography
            color="gray.textLow"
            size="sm"
            align="left"
            style={styles.subtitle}
          >
            A new version of Foam is available. Please update to continue using
            the app.
          </Typography>

          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Typography color="gray.textLow" size="xs">
                Current version
              </Typography>
              <Typography color="gray" size="xs" fontWeight="semiBold">
                {currentVersion}
              </Typography>
            </View>
            <View style={styles.versionRow}>
              <Typography color="gray.textLow" size="xs">
                Minimum required
              </Typography>
              <Typography color="gray" size="xs" fontWeight="semiBold">
                {minimumVersion}
              </Typography>
            </View>
          </View>

          <Button
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={handleUpdatePress}
            style={styles.updateButton}
            disabled={isLoading}
          >
            <Typography color="accent" contrast size="md" fontWeight="semiBold">
              {isLoading ? 'Opening Store...' : 'Update Now'}
            </Typography>
          </Button>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create(theme => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.gray.bgAlt,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: theme.colors.gray.border,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.accent.ui,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 32,
  },
  subtitle: {
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  versionInfo: {
    width: '100%',
    backgroundColor: theme.colors.gray.ui,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  versionRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  updateButton: {
    width: '100%',
    backgroundColor: theme.colors.accent.accent,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
}));
