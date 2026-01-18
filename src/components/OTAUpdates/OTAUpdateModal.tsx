import { Button } from '@app/components/Button';
import { IconSymbol } from '@app/components/IconSymbol/IconSymbol';
import { Text } from '@app/components/Text';
import { OTAUpdateState } from '@app/hooks/useOTAUpdates';
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application';
import { Modal as RNModal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

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
              color={styles.icon.color}
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
    backgroundColor: theme.colors.green.uiAlpha,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.lg,
  },
  icon: {
    color: theme.colors.green.accent,
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
  applyButton: {
    width: '100%',
    backgroundColor: theme.colors.green.accent,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  dismissButton: {
    width: '100%',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
}));
