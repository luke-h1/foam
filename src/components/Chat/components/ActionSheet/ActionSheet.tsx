import { memo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/BottomSheet/BottomSheet';
import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { MessageActionPreview } from './MessageActionPreview';

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
  onReply: () => void;
  onCopy: () => void;
  onHidePhrase?: () => void;
  onHideUser?: () => void;
  onHighlightUser?: () => void;
  onPinMessage?: () => void;
  onUpdatePinnedMessage?: () => void;
  onUnpinMessage?: () => void;
  onDeleteMessage?: () => void;
  onTimeoutUser?: () => void;
  onBanUser?: () => void;
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const {
    visible,
    onClose,
    username,
    messagePreview,
    onReply,
    onCopy,
    onHidePhrase,
    onHideUser,
    onHighlightUser,
    onPinMessage,
    onUpdatePinnedMessage,
    onUnpinMessage,
    onDeleteMessage,
    onTimeoutUser,
    onBanUser,
    isUserHighlighted,
    isPinnedMessage,
    isPinnedMessageBusy,
    canModerateChat,
    canDeleteMessage,
    canPinMessage,
    canModerateUser,
  } = props;
  const sheetRef = useRef<BottomSheetHandle>(null);
  const requestClose = () => {
    sheetRef.current?.requestClose();
  };

  const actions: ActionItem[] = (() => {
    const items: ActionItem[] = [
      {
        id: 'copy',
        label: t('messageActions.copyMessage'),
        subtitle: t('messageActions.copyMessageSubtitle'),
        onPress: () => {
          onCopy();
          requestClose();
        },
      },
      {
        id: 'reply',
        label: t('messageActions.reply'),
        subtitle: t('messageActions.replySubtitle'),
        tone: 'accent',
        onPress: () => {
          onReply();
          requestClose();
        },
      },
      {
        id: 'hide-phrase',
        label: t('messageActions.hidePhrase'),
        subtitle: t('messageActions.hidePhraseSubtitle'),
        onPress: () => {
          onHidePhrase?.();
          requestClose();
        },
      },
    ];

    if (username) {
      items.splice(2, 0, {
        id: 'hide-user',
        label: t('userActions.hideUser'),
        subtitle: t('userActions.hideUserSubtitle'),
        onPress: () => {
          onHideUser?.();
          requestClose();
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
          onHighlightUser?.();
          requestClose();
        },
      });
    }

    if (canModerateChat && canPinMessage && !isPinnedMessageBusy) {
      if (isPinnedMessage) {
        items.push(
          {
            id: 'update-pin',
            label: t('messageActions.refreshPin'),
            subtitle: t('messageActions.refreshPinSubtitle'),
            tone: 'accent',
            onPress: () => {
              onUpdatePinnedMessage?.();
              requestClose();
            },
          },
          {
            id: 'unpin-message',
            label: t('messageActions.unpinMessage'),
            subtitle: t('messageActions.unpinMessageSubtitle'),
            onPress: () => {
              onUnpinMessage?.();
              requestClose();
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
            onPinMessage?.();
            requestClose();
          },
        });
      }
    }

    if (canModerateChat) {
      if (canDeleteMessage) {
        items.push({
          id: 'delete-message',
          label: t('messageActions.deleteMessage'),
          subtitle: t('messageActions.deleteMessageSubtitle'),
          tone: 'danger',
          onPress: () => {
            onDeleteMessage?.();
            requestClose();
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
              onTimeoutUser?.();
              requestClose();
            },
          },
          {
            id: 'ban-user',
            label: t('userActions.banUser'),
            subtitle: t('userActions.banUserSubtitle'),
            tone: 'danger',
            onPress: () => {
              onBanUser?.();
              requestClose();
            },
          },
        );
      }
    }

    return items;
  })();
  const { height: windowHeight } = useWindowDimensions();
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
    },
  ];
  const scrollStyle = [styles.scroll, { maxHeight: maxScrollHeight }];

  return (
    <BottomSheet
      ref={sheetRef}
      enableFixedSnapPoints
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      snapPoints={snapPoints}
      testID='message-action-sheet'
    >
      <View style={wrapperStyle}>
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.eyebrow,
                { color: theme.color.textSecondary[scheme] },
              ]}
              weight='semibold'
            >
              {t('messageActions.eyebrow')}
            </Text>
            <Text
              style={[styles.title, { color: theme.color.text[scheme] }]}
              weight='semibold'
            >
              {t('messageActions.title')}
            </Text>
          </View>
          <Button
            label={t('common:done')}
            onPress={requestClose}
            style={[
              styles.closeButton,
              { backgroundColor: theme.color.pressedOverlay[scheme] },
            ]}
          >
            <SymbolView
              name='xmark'
              size={15}
              weight='semibold'
              tintColor={theme.color.textSecondary[scheme]}
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

          <View
            style={[
              styles.actionGroup,
              { backgroundColor: theme.color.surfaceAlpha[scheme] },
            ]}
          >
            {actions.map((action, index) => (
              <Button
                key={action.id}
                onPress={action.onPress}
                style={[
                  styles.actionButton,
                  index < actions.length - 1 && [
                    styles.actionButtonBorder,
                    { borderBottomColor: theme.color.border[scheme] },
                  ],
                ]}
              >
                <View style={styles.actionContent}>
                  <View
                    style={[
                      styles.actionIconFrame,
                      {
                        backgroundColor: theme.color.pressedOverlay[scheme],
                      },
                      action.tone === 'accent' && {
                        backgroundColor: theme.color.accentSurface[scheme],
                      },
                      action.tone === 'warning' && {
                        backgroundColor: `${theme.color.warning[scheme]}29`,
                      },
                      action.tone === 'danger' && {
                        backgroundColor: theme.color.dangerSurface[scheme],
                      },
                    ]}
                  >
                    <SymbolView
                      name={getMessageActionSFSymbolName(action.id)}
                      size={18}
                      tintColor={
                        action.tone === 'danger'
                          ? theme.color.danger[scheme]
                          : action.tone === 'warning'
                            ? theme.color.amber[scheme]
                            : action.tone === 'accent'
                              ? theme.color.accent[scheme]
                              : theme.color.textSecondary[scheme]
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
                        { color: theme.color.text[scheme] },
                        action.tone === 'danger' && {
                          color: theme.color.danger[scheme],
                        },
                      ]}
                    >
                      {action.label}
                    </Text>
                    {action.subtitle ? (
                      <Text
                        style={[
                          styles.actionSubtitle,
                          { color: theme.color.textSecondary[scheme] },
                        ]}
                      >
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
  actionIconFrame: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  actionIcon: {
    opacity: 0.9,
  },
  actionSubtitle: {
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
  },
  actionText: {
    fontSize: theme.fontSize17,
    lineHeight: theme.fontSize17 * 1.2,
  },
  closeButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  eyebrow: {
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
    fontSize: theme.fontSize16,
    lineHeight: theme.fontSize16 * 1.25,
  },
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.space12,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
    width: '100%',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: theme.space12,
    paddingBottom: theme.space16,
  },
});
