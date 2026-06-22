import { memo } from 'react';
import { Button } from '@app/components/Button/Button';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { MessageActionPreview } from './MessageActionPreview';
import { useTranslation } from 'react-i18next';

type MessageActionId =
  | 'copy'
  | 'reply'
  | 'hide-user'
  | 'highlight-user'
  | 'hide-phrase'
  | 'pin-message'
  | 'update-pin'
  | 'unpin-message'
  | 'delete-message'
  | 'timeout-user'
  | 'ban-user';

function getMessageActionSFSymbolName(actionId: MessageActionId) {
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
    case 'pin-message':
      return 'pin' as const;
    case 'update-pin':
      return 'pin.fill' as const;
    case 'unpin-message':
      return 'pin.slash' as const;
    case 'delete-message':
      return 'trash' as const;
    case 'timeout-user':
      return 'clock' as const;
    case 'ban-user':
      return 'slash.circle' as const;
    default:
      return 'questionmark.circle' as const;
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
  username?: string;
  messagePreview?: ParsedPart[];
  handleReply: () => void;
  handleCopy: () => void;
  handleHidePhrase?: () => void;
  handleHideUser?: () => void;
  handleHighlightUser?: () => void;
  handlePinMessage?: () => void;
  handleUpdatePinnedMessage?: () => void;
  handleUnpinMessage?: () => void;
  handleDeleteMessage?: () => void;
  handleTimeoutUser?: () => void;
  handleBanUser?: () => void;
  isUserHighlighted?: boolean;
  isPinnedMessage?: boolean;
  isPinnedMessageBusy?: boolean;
  canModerateChat?: boolean;
  canDeleteMessage?: boolean;
  canPinMessage?: boolean;
  canModerateUser?: boolean;
}

type ActionItem = {
  id:
    | 'copy'
    | 'reply'
    | 'hide-user'
    | 'highlight-user'
    | 'hide-phrase'
    | 'pin-message'
    | 'update-pin'
    | 'unpin-message'
    | 'delete-message'
    | 'timeout-user'
    | 'ban-user';
  label: string;
  onPress: () => void;
  subtitle?: string;
  tone?: 'accent' | 'danger' | 'default' | 'warning';
};

function ActionSheetComponent(props: Props) {
  const { t } = useTranslation(['chat', 'common']);
  const {
    visible,
    onClose,
    username,
    messagePreview,
    handleReply,
    handleCopy,
    handleHidePhrase,
    handleHideUser,
    handleHighlightUser,
    handlePinMessage,
    handleUpdatePinnedMessage,
    handleUnpinMessage,
    handleDeleteMessage,
    handleTimeoutUser,
    handleBanUser,
    isUserHighlighted,
    isPinnedMessage,
    isPinnedMessageBusy,
    canModerateChat,
    canDeleteMessage,
    canPinMessage,
    canModerateUser,
  } = props;

  const actions: ActionItem[] = (() => {
    const items: ActionItem[] = [
      {
        id: 'copy',
        label: t('messageActions.copyMessage'),
        subtitle: t('messageActions.copyMessageSubtitle'),
        onPress: () => {
          handleCopy();
          onClose();
        },
      },
      {
        id: 'reply',
        label: t('messageActions.reply'),
        subtitle: t('messageActions.replySubtitle'),
        tone: 'accent',
        onPress: () => {
          handleReply();
          onClose();
        },
      },
      {
        id: 'hide-phrase',
        label: t('messageActions.hidePhrase'),
        subtitle: t('messageActions.hidePhraseSubtitle'),
        onPress: () => {
          handleHidePhrase?.();
          onClose();
        },
      },
    ];

    if (username) {
      items.splice(2, 0, {
        id: 'hide-user',
        label: t('userActions.hideUser'),
        subtitle: t('userActions.hideUserSubtitle'),
        onPress: () => {
          handleHideUser?.();
          onClose();
        },
      });

      items.splice(3, 0, {
        id: 'highlight-user',
        label: isUserHighlighted
          ? t('userActions.unhighlightUser')
          : t('userActions.highlightUser'),
        subtitle: isUserHighlighted
          ? t('userActions.unhighlightUserSubtitle')
          : t('userActions.highlightUserSubtitle'),
        tone: 'accent',
        onPress: () => {
          handleHighlightUser?.();
          onClose();
        },
      });
    }

    if (canModerateChat) {
      if (canPinMessage && !isPinnedMessageBusy) {
        if (isPinnedMessage) {
          items.push(
            {
              id: 'update-pin',
              label: t('messageActions.refreshPin'),
              subtitle: t('messageActions.refreshPinSubtitle'),
              tone: 'accent',
              onPress: () => {
                handleUpdatePinnedMessage?.();
                onClose();
              },
            },
            {
              id: 'unpin-message',
              label: t('messageActions.unpinMessage'),
              subtitle: t('messageActions.unpinMessageSubtitle'),
              onPress: () => {
                handleUnpinMessage?.();
                onClose();
              },
            },
          );
        } else {
          items.push({
            id: 'pin-message',
            label: t('messageActions.pinMessage'),
            subtitle: t('messageActions.pinMessageSubtitle'),
            tone: 'accent',
            onPress: () => {
              handlePinMessage?.();
              onClose();
            },
          });
        }
      }

      if (canDeleteMessage) {
        items.push({
          id: 'delete-message',
          label: t('messageActions.deleteMessage'),
          subtitle: t('messageActions.deleteMessageSubtitle'),
          tone: 'danger',
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
            label: t('userActions.timeoutUser'),
            subtitle: t('userActions.timeoutUserSubtitle'),
            tone: 'warning',
            onPress: () => {
              handleTimeoutUser?.();
              onClose();
            },
          },
          {
            id: 'ban-user',
            label: t('userActions.banUser'),
            subtitle: t('userActions.banUserSubtitle'),
            tone: 'danger',
            onPress: () => {
              handleBanUser?.();
              onClose();
            },
          },
        );
      }
    }

    return items;
  })();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const sheetWidth = Math.max(
    280,
    Math.min(windowWidth - theme.space16 * 2, 520),
  );
  const maxScrollHeight = Math.min(
    Math.round(windowHeight * 0.62),
    actions.length * 58 + 116,
  );
  const sheetHeight = Math.min(
    Math.round(windowHeight * 0.82),
    Math.max(360, actions.length * 58 + 224),
  );
  const snapPoints = [{ height: sheetHeight }];
  const wrapperStyle = [
    styles.wrapper,
    {
      maxHeight: sheetHeight - theme.space16,
      width: sheetWidth,
    },
  ];
  const scrollStyle = [styles.scroll, { maxHeight: maxScrollHeight }];

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      snapPoints={snapPoints}
      testID='message-action-sheet'
    >
      <View style={wrapperStyle}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow} weight='semibold'>
              {t('messageActions.eyebrow')}
            </Text>
            <Text style={styles.title} weight='semibold'>
              {t('messageActions.title')}
            </Text>
          </View>
          <Button
            label={t('common:done')}
            onPress={onClose}
            style={styles.closeButton}
          >
            <SymbolView
              name='xmark'
              size={15}
              weight='semibold'
              tintColor={theme.color.textSecondary.dark}
            />
          </Button>
        </View>

        <ScrollView
          style={scrollStyle}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messagePreview ? (
            <MessageActionPreview
              message={messagePreview}
              username={username}
            />
          ) : null}

          <View style={styles.actionGroup}>
            {actions.map((action, index) => (
              <Button
                key={action.id}
                onPress={action.onPress}
                style={[
                  styles.actionButton,
                  index < actions.length - 1 && styles.actionButtonBorder,
                ]}
              >
                <View style={styles.actionContent}>
                  <View
                    style={[
                      styles.actionIconFrame,
                      action.tone === 'accent' && styles.actionIconAccent,
                      action.tone === 'warning' && styles.actionIconWarning,
                      action.tone === 'danger' && styles.actionIconDanger,
                    ]}
                  >
                    <SymbolView
                      name={getMessageActionSFSymbolName(action.id)}
                      size={18}
                      tintColor={
                        action.tone === 'danger'
                          ? theme.colorRed
                          : action.tone === 'warning'
                            ? theme.colorAmber
                            : action.tone === 'accent'
                              ? theme.colorPrimary
                              : '#b7bdc9'
                      }
                      weight='regular'
                      style={styles.actionIcon}
                    />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text
                      weight='semibold'
                      style={[
                        styles.actionText,
                        action.tone === 'danger' && styles.actionTextDanger,
                      ]}
                    >
                      {action.label}
                    </Text>
                    {action.subtitle ? (
                      <Text style={styles.actionSubtitle}>
                        {action.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const ActionSheet = memo(ActionSheetComponent);

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: 'transparent',
    minHeight: 56,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  actionButtonBorder: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
  actionCopy: {
    flex: 1,
    gap: 1,
  },
  actionGroup: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
  actionIconAccent: {
    backgroundColor: 'rgba(46,134,255,0.16)',
  },
  actionIconDanger: {
    backgroundColor: theme.colorRedSurface,
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  actionIconWarning: {
    backgroundColor: 'rgba(224,163,58,0.16)',
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionSubtitle: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize17,
    lineHeight: theme.fontSize17 * 1.2,
  },
  actionTextDanger: {
    color: theme.colorRed,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  eyebrow: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.space4,
  },
  title: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize16,
    lineHeight: theme.fontSize16 * 1.25,
  },
  wrapper: {
    alignSelf: 'center',
    gap: theme.space12,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: theme.space12,
    paddingBottom: theme.space16,
  },
});
