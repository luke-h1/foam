import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { memo, useCallback } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

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
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text weight="bold" style={styles.title}>
              Debug Test Messages
            </Text>
            <Button onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </Button>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

ChatDebugModalComponent.displayName = 'ChatDebugModal';

export const ChatDebugModal = memo(ChatDebugModalComponent);

export type { TestMessageType };

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.space20,
  },
  content: {
    paddingBottom: theme.space36,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space8,
  },
  doneButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  doneText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: theme.space16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    marginBottom: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  scroll: {
    flex: 1,
  },
  sheet: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '82%',
    overflow: 'hidden',
    width: '100%',
  },
  title: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize18,
  },
});
