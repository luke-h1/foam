import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  message: ParsedPart[];
  username?: string;
  handleReply: () => void;
  handleCopy: () => void;
  handleHidePhrase?: () => void;
  handleHideUser?: () => void;
  handleHighlightUser?: () => void;
  handleDeleteMessage?: () => void;
  handleTimeoutUser?: () => void;
  handleBanUser?: () => void;
  isUserHighlighted?: boolean;
  canModerateChat?: boolean;
  canDeleteMessage?: boolean;
  canModerateUser?: boolean;
}

type ActionItem = {
  icon: string;
  id:
    | 'copy'
    | 'reply'
    | 'hide-user'
    | 'highlight-user'
    | 'hide-phrase'
    | 'delete-message'
    | 'timeout-user'
    | 'ban-user';
  label: string;
  onPress: () => void;
};

export function ActionSheet(props: Props) {
  const {
    visible,
    onClose,
    message,
    username,
    handleReply,
    handleCopy,
    handleHidePhrase,
    handleHideUser,
    handleHighlightUser,
    handleDeleteMessage,
    handleTimeoutUser,
    handleBanUser,
    isUserHighlighted,
    canModerateChat,
    canDeleteMessage,
    canModerateUser,
  } = props;

  const actions = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [
      {
        id: 'copy',
        icon: 'copy',
        label: 'Copy Message',
        onPress: () => {
          handleCopy();
          onClose();
        },
      },
      {
        id: 'reply',
        icon: 'corner-up-left',
        label: 'Reply',
        onPress: () => {
          handleReply();
          onClose();
        },
      },
      {
        id: 'hide-phrase',
        icon: 'slash',
        label: 'Hide Phrase',
        onPress: () => {
          handleHidePhrase?.();
          onClose();
        },
      },
    ];

    if (username) {
      items.splice(2, 0, {
        id: 'hide-user',
        icon: 'user-x',
        label: 'Hide User',
        onPress: () => {
          handleHideUser?.();
          onClose();
        },
      });

      items.splice(3, 0, {
        id: 'highlight-user',
        icon: 'star',
        label: isUserHighlighted ? 'Unhighlight User' : 'Highlight User',
        onPress: () => {
          handleHighlightUser?.();
          onClose();
        },
      });
    }

    if (canModerateChat) {
      if (canDeleteMessage) {
        items.push({
          id: 'delete-message',
          icon: 'trash-2',
          label: 'Delete Message',
          onPress: () => {
            handleDeleteMessage?.();
            onClose();
          },
        });
      }

      if (canModerateUser) {
        items.push(
          {
            id: 'timeout-user',
            icon: 'clock',
            label: 'Timeout for 10m',
            onPress: () => {
              handleTimeoutUser?.();
              onClose();
            },
          },
          {
            id: 'ban-user',
            icon: 'slash',
            label: 'Ban User',
            onPress: () => {
              handleBanUser?.();
              onClose();
            },
          },
        );
      }
    }

    return items;
  }, [
    canDeleteMessage,
    canModerateChat,
    canModerateUser,
    handleBanUser,
    handleCopy,
    handleDeleteMessage,
    handleReply,
    handleTimeoutUser,
    username,
    handleHideUser,
    handleHighlightUser,
    isUserHighlighted,
    handleHidePhrase,
    onClose,
  ]);

  const getSFSymbolName = useCallback(
    (
      actionId:
        | 'copy'
        | 'reply'
        | 'hide-user'
        | 'highlight-user'
        | 'hide-phrase'
        | 'delete-message'
        | 'timeout-user'
        | 'ban-user',
    ) => {
      switch (actionId) {
        case 'copy':
          return 'doc.on.doc' as const;
        case 'reply':
          return 'arrowshape.turn.up.left' as const;
        case 'hide-user':
          return 'person.crop.circle.badge.xmark' as const;
        case 'highlight-user':
          return 'star' as const;
        case 'hide-phrase':
          return 'nosign' as const;
        case 'delete-message':
          return 'trash' as const;
        case 'timeout-user':
          return 'clock' as const;
        case 'ban-user':
          return 'slash.circle' as const;
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
            trackLoadTime
            trackLoadContext="chat.message-action-sheet"
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
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.wrapper}>
          <View style={styles.header}>
            <Text style={styles.title} weight="semibold">
              Message Actions
            </Text>
            <Button onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Done</Text>
            </Button>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.previewCard}>
              <View style={styles.messageLine}>
                {username ? (
                  <Text style={styles.usernameText}>{username}: </Text>
                ) : null}
                {message.map(renderMessagePart)}
              </View>
            </View>

            <View style={styles.actionGroup}>
              {actions.map((action, index) => (
                <Button
                  key={action.label}
                  onPress={action.onPress}
                  style={[
                    styles.actionButton,
                    index < actions.length - 1 && styles.actionButtonBorder,
                  ]}
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: theme.color.background.darkAlt,
    minHeight: 48,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  actionButtonBorder: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
  actionGroup: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    fontWeight: Platform.select({ ios: '400', android: '400' }),
  },
  closeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  closeText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    fontWeight: '600',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: theme.space20,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.space16,
  },
  messageEmote: {
    height: 24,
    marginHorizontal: 2,
    width: 24,
  },
  messageLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  messageText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    lineHeight: theme.fontSize16 * 1.25,
  },
  previewCard: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  title: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
  },
  usernameText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    fontWeight: '600',
  },
  wrapper: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: 24,
    borderWidth: 1,
    gap: theme.space16,
    maxHeight: '82%',
    overflow: 'hidden',
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: theme.space16,
    paddingBottom: theme.space20,
  },
});

ActionSheet.displayName = 'ActionSheet';
