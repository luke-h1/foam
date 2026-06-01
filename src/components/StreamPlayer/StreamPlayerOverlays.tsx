import { Button } from '@app/components/Button/Button';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DebugErrorOverlayProps {
  error: { statusCode: number; url: string };
  onDismiss: () => void;
}

export function DebugErrorOverlay({
  error,
  onDismiss,
}: DebugErrorOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.debugErrorOverlay, { bottom: insets.bottom + 24 }]}>
      <Text color="red" weight="semibold">
        HTTP {error.statusCode}
      </Text>
      <Text color="gray.contrast" type="xs" numberOfLines={3}>
        {error.url}
      </Text>
      <Button onPress={onDismiss} style={styles.debugDismissButton}>
        <Text color="gray.contrast" type="xs">
          Dismiss
        </Text>
      </Button>
    </View>
  );
}

export function ControlsTriggerButton({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <PressableArea
      onPress={onPress}
      style={[
        styles.controlsTriggerButton,
        { top: insets.top + theme.space12 },
      ]}
      accessibilityLabel="Show player controls"
      accessibilityRole="button"
    >
      <SymbolView name="ellipsis" size={24} tintColor={theme.colorWhite} />
    </PressableArea>
  );
}

export function TouchBlockOverlay({
  gesture,
}: {
  gesture: ComponentProps<typeof GestureDetector>['gesture'];
}) {
  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.touchBlockOverlay}
        accessibilityLabel="Show player controls"
        accessibilityRole="button"
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  controlsTriggerButton: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 40,
    justifyContent: 'center',
    padding: theme.space12,
    position: 'absolute',
    right: theme.space12,
    width: 40,
  },
  debugDismissButton: {
    marginTop: theme.space8,
  },
  debugErrorOverlay: {
    backgroundColor: theme.colorBlackActiveContent,
    left: theme.space12,
    maxWidth: '95%',
    padding: theme.space12,
    position: 'absolute',
    right: theme.space12,
  },
  touchBlockOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
