import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

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

const styles = StyleSheet.create({
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
});
