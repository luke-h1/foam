import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/Text/Text';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo } from 'react';
import { Modal, Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface Props {
  visible: boolean;
  onClose: () => void;
  message: ParsedPart[];
  username?: string;
  handleReply: () => void;
  handleCopy: () => void;
}

export function ActionSheet(props: Props) {
  const { visible, onClose, message, username, handleReply, handleCopy } =
    props;

  const actions = useMemo(
    () => [
      {
        id: 'copy' as const,
        icon: 'copy',
        label: 'Copy Message',
        onPress: () => {
          handleCopy();
          onClose();
        },
      },
      {
        id: 'reply' as const,
        icon: 'arrowshape.turn.up.left',
        label: 'Reply',
        onPress: () => {
          handleReply();
          onClose();
        },
      },
      {
        id: 'report' as const,
        icon: 'arrow.up.right.square',
        label: 'Report message',
        onPress: onClose,
      },
    ],
    [handleCopy, handleReply, onClose],
  );

  const getSFSymbolName = useCallback(
    (actionId: 'copy' | 'reply' | 'report') => {
      switch (actionId) {
        case 'copy':
          return 'doc.on.doc' as const;
        case 'reply':
          return 'arrowshape.turn.up.left' as const;
        case 'report':
          return 'arrow.up.right.square' as const;
        default:
          return 'questionmark.circle' as const;
      }
    },
    [],
  );

  const renderMessagePart = useCallback((part: ParsedPart, index: number) => {
    switch (part.type) {
      case 'emote':
        if (!part.url) return null;
        return (
          <Image
            key={`${part.type}-${part.id ?? index}-${index}`}
            useNitro
            source={part.url}
            style={styles.messageEmote}
            contentFit="contain"
            transition={0}
          />
        );
      case 'mention':
      case 'text':
        return (
          <Text key={`${part.type}-${index}`} style={styles.messageText}>
            {part.content}
          </Text>
        );
      default:
        if ('content' in part && typeof part.content === 'string') {
          return (
            <Text key={`${part.type}-${index}`} style={styles.messageText}>
              {part.content}
            </Text>
          );
        }
        return null;
    }
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        <View style={styles.previewCard}>
          <View style={styles.messageLine}>
            {username ? (
              <Text style={styles.usernameText}>{username}: </Text>
            ) : null}
            {message.map(renderMessagePart)}
          </View>
        </View>

        <View style={styles.actionGroup}>
          {actions.map(action => (
            <Button
              key={action.label}
              onPress={action.onPress}
              style={styles.actionButton}
            >
              <View style={styles.actionContent}>
                {Platform.OS === 'ios' ? (
                  <SymbolView
                    name={getSFSymbolName(action.id)}
                    size={18}
                    tintColor="#b7bdc9"
                    weight="regular"
                    style={styles.actionIcon}
                  />
                ) : (
                  <Icon icon={action.icon} color="#b7bdc9" size={18} />
                )}
                <Text style={styles.actionText}>{action.label}</Text>
              </View>
            </Button>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create(theme => ({
  wrapper: {
    flex: 1,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#171b23',
    gap: theme.spacing.lg,
  },
  previewCard: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  messageLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  usernameText: {
    color: theme.colors.gray.text,
    fontWeight: '600',
    fontSize: theme.font.fontSize.lg,
  },
  messageText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.lg,
    lineHeight: theme.font.fontSize.lg * 1.25,
  },
  messageEmote: {
    width: 24,
    height: 24,
    marginHorizontal: 2,
  },
  actionGroup: {
    borderRadius: theme.radii.xl,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  actionButton: {
    minHeight: Platform.select({ ios: 56, android: 56 }),
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionText: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.md,
    fontWeight: Platform.select({ ios: '400', android: '400' }),
  },
}));

ActionSheet.displayName = 'ActionSheet';
