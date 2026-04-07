import { Button } from '@app/components/Button/Button';
import { IconSymbol } from '@app/components/IconSymbol/IconSymbol';
import { Text } from '@app/components/Text/Text';
import { OTAUpdateState } from '@app/hooks/useOTAUpdates';
import { theme } from '@app/styles/themes';
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application';
import { Modal as RNModal, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OTAUpdateModalProps {
  visible: boolean;
  updateState: OTAUpdateState;
  onDismiss: () => void;
  onApply: () => void;
}

export function OTAUpdateModal({
  visible,
  updateState,
  onDismiss,
  onApply,
}: OTAUpdateModalProps) {
  const insets = useSafeAreaInsets();
  const isDownloading = updateState.status === 'downloading';
  const isPending = updateState.status === 'pending';

  return (
    <RNModal
      animationType="fade"
      transparent
      visible={visible}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <IconSymbol
              name="arrow.down.circle.fill"
              color={theme.colors.green.accent}
              size={40}
            />
          </View>

          <Text color="gray" type="xl" weight="bold" align="center">
            Update Available
          </Text>

          <Text
            color="gray.textLow"
            type="sm"
            align="center"
            style={styles.subtitle}
          >
            A new version of Foam has been downloaded and is ready to install.
            Relaunch to apply the update.
          </Text>

          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Text color="gray.textLow" type="xs">
                Current version
              </Text>
              <Text color="gray" type="xs" weight="semibold">
                {nativeApplicationVersion} ({nativeBuildVersion})
              </Text>
            </View>
          </View>

          <Button
            onPress={onApply}
            style={styles.applyButton}
            disabled={isDownloading || !isPending}
          >
            <Text color="accent" contrast type="md" weight="semibold">
              {isDownloading ? 'Downloading...' : 'Relaunch'}
            </Text>
          </Button>

          <Button onPress={onDismiss} style={styles.dismissButton}>
            <Text color="gray.textLow" type="sm" weight="medium">
              Defer
            </Text>
          </Button>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  applyButton: {
    alignItems: 'center' as const,
    backgroundColor: theme.colors.green.accent,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    justifyContent: 'center' as const,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
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
  dismissButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center' as const,
    backgroundColor: theme.colors.green.uiAlpha,
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
