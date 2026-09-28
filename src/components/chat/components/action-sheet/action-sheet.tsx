import { memo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/bottom-sheet/bottom-sheet';
import { Button } from '@app/components/button/button';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/utils/chat/message-token';

import { MessageActionPreview } from './message-action-preview';

type MessageActionId =
  | 'copy'
  | 'reply'
  | 'hide-user'
  | 'highlight-user'
  | 'hide-phrase'
  | 'report-user'
  | 'block-user'
  | 'pin-message'
  | 'update-pin'
  | 'unpin-message'
  | 'delete-message'
  | 'timeout-user'
  | 'ban-user';

function getMessageActionSFSymbolName(actionId: MessageActionId) {
  switch (actionId) {
    case 'copy':
      return 'doc.on.doc';
    case 'reply':
      return 'arrowshape.turn.up.left';
    case 'hide-user':
      return 'person.crop.circle.badge.xmark';
    case 'highlight-user':
      return 'star';
    case 'hide-phrase':
      return 'nosign';
    case 'report-user':
      return 'flag';
    case 'block-user':
      return 'slash.circle';
    case 'pin-message':
      return 'pin';
    case 'update-pin':
      return 'pin.fill';
    case 'unpin-message':
      return 'pin.slash';
    case 'delete-message':
      return 'trash';
    case 'timeout-user':
      return 'clock';
    case 'ban-user':
      return 'slash.circle';
    default:
      return 'questionmark.circle';
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
  username?: string;
  messagePreview?: MessageToken[];
  onReply: () => void;
  onCopy: () => void;
  onHidePhrase?: () => void;
  onHideUser?: () => void;
  onHighlightUser?: () => void;
  onReportUser?: () => void;
  onBlockUser?: () => void;
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
  id: MessageActionId;
  label: string;
  onPress: () => void;
  subtitle?: string;
  tone?: 'accent' | 'danger' | 'default' | 'warning';
};

type MessageActionTone = ActionItem['tone'];

function getMessageActionTintColor(tone: MessageActionTone) {
  switch (tone) {
    case 'danger':
      return theme.colorRed;
    case 'warning':
      return theme.colorAmber;
    case 'accent':
      return theme.colorPrimary;
    case 'default':
    case undefined:
      return theme.color.textSecondary.dark;
    default: {
      const unreachable: never = tone;
      return unreachable;
    }
  }
}

function getMessageActionIconFrameStyle(tone: MessageActionTone) {
  switch (tone) {
    case 'accent':
      return styles.actionIconAccent;
    case 'warning':
      return styles.actionIconWarning;
    case 'danger':
      return styles.actionIconDanger;
    case 'default':
    case undefined:
      return undefined;
    default: {
      const unreachable: never = tone;
      return unreachable;
    }
  }
}

function ActionSheetComponent(props: Props) {
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
    onReportUser,
    onBlockUser,
  } = props;

  const sheetRef = useRef<BottomSheetHandle>(null);

  const requestClose = () => {
    sheetRef.current?.requestClose();
  };

  const actions: ActionItem[] = (() => {
    const items: ActionItem[] = [
      {
        id: 'copy',
        label: 'Copy Message',
        subtitle: 'Text and emotes',
        onPress: () => onCopy(),
      },
      {
        id: 'reply',
        label: 'Reply',
        subtitle: 'Quote in composer',
        tone: 'accent',
        onPress: () => onReply(),
      },
      {
        id: 'hide-phrase',
        label: 'Hide Phrase',
        subtitle: 'Filter this wording',
        onPress: () => onHidePhrase?.(),
      },
    ];

    if (username) {
      items.splice(2, 0, {
        id: 'hide-user',
        label: 'Hide User',
        subtitle: 'Mute locally',
        onPress: () => onHideUser?.(),
      });

      items.splice(3, 0, {
        id: 'highlight-user',
        label: isUserHighlighted ? 'Unhighlight User' : 'Highlight User',
        subtitle: isUserHighlighted ? 'Remove marker' : 'Mark future messages',
        tone: 'accent',
        onPress: () => onHighlightUser?.(),
      });

      items.push({
        id: 'report-user',
        label: 'Report Message',
        subtitle: 'Report this user via the Twitch report form',
        tone: 'warning',
        onPress: () => onReportUser?.(),
      });
    }

    if (username && onBlockUser) {
      items.push({
        id: 'block-user',
        label: 'Block User',
        subtitle: 'Block on Twitch',
        tone: 'danger',
        onPress: () => onBlockUser(),
      });
    }

    const canChangePin = Boolean(
      canModerateChat && canPinMessage && !isPinnedMessageBusy,
    );

    if (canChangePin && isPinnedMessage) {
      items.push(
        {
          id: 'update-pin',
          label: 'Refresh Pin',
          subtitle: 'Extend pinned message',
          tone: 'accent',
          onPress: () => onUpdatePinnedMessage?.(),
        },
        {
          id: 'unpin-message',
          label: 'Unpin Message',
          subtitle: 'Remove from header',
          onPress: () => onUnpinMessage?.(),
        },
      );
    }

    if (canChangePin && !isPinnedMessage) {
      items.push({
        id: 'pin-message',
        label: 'Pin Message',
        subtitle: 'Keep at top',
        tone: 'accent',
        onPress: () => onPinMessage?.(),
      });
    }

    if (canModerateChat && canDeleteMessage) {
      items.push({
        id: 'delete-message',
        label: 'Delete Message',
        subtitle: 'Remove from chat',
        tone: 'danger',
        onPress: () => onDeleteMessage?.(),
      });
    }

    if (canModerateChat && canModerateUser) {
      items.push(
        {
          id: 'timeout-user',
          label: 'Timeout…',
          subtitle: 'Temporary moderation',
          tone: 'warning',
          onPress: () => onTimeoutUser?.(),
        },
        {
          id: 'ban-user',
          label: 'Ban User',
          subtitle: 'Permanent moderation',
          tone: 'danger',
          onPress: () => onBanUser?.(),
        },
      );
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
            <Text style={styles.eyebrow} weight='semibold'>
              Selected message
            </Text>
            <Text style={styles.title} weight='semibold'>
              Message Actions
            </Text>
          </View>
          <Button
            label='Done'
            onPress={requestClose}
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
          nestedScrollEnabled
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
                onPress={() => {
                  action.onPress();
                  requestClose();
                }}
                style={[
                  styles.actionButton,
                  index < actions.length - 1 && styles.actionButtonBorder,
                ]}
              >
                <View style={styles.actionContent}>
                  <View
                    style={[
                      styles.actionIconFrame,
                      getMessageActionIconFrameStyle(action.tone),
                    ]}
                  >
                    <SymbolView
                      name={getMessageActionSFSymbolName(action.id)}
                      size={18}
                      tintColor={getMessageActionTintColor(action.tone)}
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
