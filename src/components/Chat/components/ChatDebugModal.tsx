import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { memo, useCallback } from 'react';
import { Modal, View, StyleSheet } from 'react-native';

type TestMessageType =
  | 'Prime Sub'
  | 'Tier 1 Sub'
  | 'Tier 2 Sub'
  | 'Tier 3 Sub'
  | 'Default Sub'
  | 'Viewer Milestone';

interface ChatDebugModalProps {
  visible: boolean;
  onClose: () => void;
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

const ChatDebugModalComponent = ({
  visible,
  onClose,
  onTestMessage,
  onClearChatCache,
  onClearImageCache,
}: ChatDebugModalProps) => {
  const handleTestMessage = useCallback(
    (type: TestMessageType) => {
      onTestMessage(type);
      onClose();
    },
    [onTestMessage, onClose],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.content}>
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
      </View>
    </Modal>
  );
};

ChatDebugModalComponent.displayName = 'ChatDebugModal';

export const ChatDebugModal = memo(ChatDebugModalComponent);

export type { TestMessageType };

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  item: {
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.font.fontSize.lg,
  },
});
