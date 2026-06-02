import { Button } from '@app/components/Button/Button';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
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
      <Text color='red' weight='semibold'>
        HTTP {error.statusCode}
      </Text>
      <Text color='gray.contrast' type='xs' numberOfLines={3}>
        {error.url}
      </Text>
      <Button onPress={onDismiss} style={styles.debugDismissButton}>
        <Text color='gray.contrast' type='xs'>
          Dismiss
        </Text>
      </Button>
    </View>
  );
}

export function ControlsTriggerButton({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const topOffset =
    height >= width ? theme.space12 : insets.top + theme.space12;

  return (
    <PressableArea
      onPress={onPress}
      style={[styles.controlsTriggerButton, { top: topOffset }]}
      accessibilityLabel='Show player controls'
      accessibilityRole='button'
    >
      <SymbolView name='ellipsis' size={24} tintColor={theme.colorWhite} />
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
        accessibilityLabel='Show player controls'
        accessibilityRole='button'
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  controlsTriggerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,22,22,0.58)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderCurve: 'continuous',
    borderWidth: 1,
    borderRadius: theme.borderRadius999,
    height: 44,
    justifyContent: 'center',
    padding: theme.space8,
    position: 'absolute',
    right: theme.space20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    width: 44,
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
