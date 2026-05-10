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
  const isCritical = updateState.urgency === 'critical';
  const title = isCritical ? 'Critical Update Ready' : 'Update Available';
  const subtitle = isCritical
    ? isPending
      ? 'An urgent fix has been downloaded. Install it now to continue with the latest version of Foam.'
      : 'An urgent fix is being downloaded now. Install will be available as soon as the download completes.'
    : 'A new version of Foam has been downloaded and is ready to install. Relaunch to apply the update.';
  const actionLabel = isDownloading
    ? isCritical
      ? 'Downloading critical update...'
      : 'Downloading...'
    : isCritical
      ? 'Install update'
      : 'Relaunch';

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
              color={theme.colorGreen}
              size={40}
            />
          </View>

          <Text color="gray" type="xl" weight="bold" align="center">
            {title}
          </Text>

          <Text
            color="gray.textLow"
            type="sm"
            align="center"
            style={styles.subtitle}
          >
            {subtitle}
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
              {actionLabel}
            </Text>
          </Button>

          {!isCritical ? (
            <Button onPress={onDismiss} style={styles.dismissButton}>
              <Text color="gray.textLow" type="sm" weight="medium">
                Defer
              </Text>
            </Button>
          ) : null}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  applyButton: {
    alignItems: 'center' as const,
    backgroundColor: theme.colorGreen,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    justifyContent: 'center' as const,
    paddingVertical: theme.space16,
    width: '100%',
  },
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
  dismissButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: theme.space12,
    paddingVertical: theme.space12,
    width: '100%',
  },
  iconContainer: {
    alignItems: 'center' as const,
    backgroundColor: theme.colorGreenSurface,
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
