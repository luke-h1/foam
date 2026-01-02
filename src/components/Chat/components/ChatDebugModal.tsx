import { Button } from '@app/components/Button';
import { Text } from '@app/components/Text';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef, memo, useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type TestMessageType =
  | 'Prime Sub'
  | 'Tier 1 Sub'
  | 'Tier 2 Sub'
  | 'Tier 3 Sub'
  | 'Default Sub'
  | 'Viewer Milestone';

interface ChatDebugModalProps {
  onTestMessage: (type: TestMessageType) => void;
  onClearChatCache: () => void;
  onClearImageCache: () => void;
}

const DEBUG_OPTIONS: Array<{ label: string; type: TestMessageType }> = [
  { label: 'Prime Sub', type: 'Prime Sub' },
  { label: 'Tier 1 Sub', type: 'Tier 1 Sub' },
  { label: 'Tier 2 Sub', type: 'Tier 2 Sub' },
  { label: 'Tier 3 Sub', type: 'Tier 3 Sub' },
  { label: 'Default Sub', type: 'Default Sub' },
  { label: 'Viewer Milestone', type: 'Viewer Milestone' },
];

const ChatDebugModalComponent = forwardRef<
  BottomSheetModal,
  ChatDebugModalProps
>(({ onTestMessage, onClearChatCache, onClearImageCache }, ref) => {
  const handleDismiss = useCallback(() => {
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.dismiss();
    }
  }, [ref]);

  const handleTestMessage = useCallback(
    (type: TestMessageType) => {
      onTestMessage(type);
      handleDismiss();
    },
    [onTestMessage, handleDismiss],
  );

  return (
    <BottomSheetModal
      ref={ref}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      enablePanDownToClose
      snapPoints={['50%']}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text weight="bold" style={styles.title}>
            Debug Test Messages
          </Text>
        </View>

        {DEBUG_OPTIONS.map(option => (
          <Button
            key={option.type}
            onPress={() => handleTestMessage(option.type)}
            style={styles.item}
          >
            <Text>{option.label}</Text>
          </Button>
        ))}

        <Button onPress={onClearChatCache} style={styles.item}>
          <Text>Clear Chat Cache</Text>
        </Button>

        <Button onPress={onClearImageCache} style={styles.item}>
          <Text>Clear Image Cache</Text>
        </Button>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

ChatDebugModalComponent.displayName = 'ChatDebugModal';

export const ChatDebugModal = memo(ChatDebugModalComponent);

export type { TestMessageType };

const styles = StyleSheet.create(theme => ({
  background: {
    backgroundColor: theme.colors.gray.bg,
  },
  handle: {
    backgroundColor: theme.colors.gray.accent,
    width: 36,
    height: 4,
    borderRadius: theme.radii.full,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  header: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.font.fontSize.lg,
  },
  item: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
}));
