import { memo, useMemo, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  BottomSheet,
  type BottomSheetHandle,
  type SnapPoint,
} from '@app/components/bottom-sheet/bottom-sheet';
import { Button } from '@app/components/button/button';
import { ChatDebugSection } from '@app/components/chat/components/chat-debug-section';
import { MessageTokenLine } from '@app/components/chat/components/message-token-line/message-token-line';
import { SheetHeader } from '@app/components/chat/components/sheet/sheet-header';
import {
  type SheetAction,
  SheetActionGroup,
} from '@app/components/chat/components/sheet-action-group';
import type {
  ChatModerationAccessFlags,
  UserActionVisibilityFlags,
} from '@app/components/chat/types/chat-ui-flags';
import {
  banUserAction,
  blockUserAction,
  timeoutUserAction,
} from '@app/components/chat/util/user-sheet-actions';
import { SettingsSection } from '@app/components/settings-section/settings-section';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import {
  getChatDebugIrcLinesForLogin,
  getChatDebugUserSnapshot,
} from '@app/store/chat/actions/chat-debug-log';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { theme } from '@app/styles/themes';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { getChatMessageStoreId } from '@app/utils/chat/message-identity/get-chat-message-store-id';
import type { MessageToken } from '@app/utils/chat/message-token';
import { replaceEmotesWithText } from '@app/utils/chat/replace-emotes-with-text';

import { UserCardHeader } from './user-card-header';

interface UserActionSheetProps {
  color?: string;
  login?: string;
  userId?: string;
  moderation: ChatModerationAccessFlags;
  visibility: UserActionVisibilityFlags;
  onClose: () => void;
  onCopyUsername: () => void;
  onHideUser: () => void;
  onHighlightUser: () => void;
  onMentionUser: () => void;
  onBlockUser?: () => void;
  onReportUser?: () => void;
  onTimeoutUser?: () => void;
  onWarnUser?: () => void;
  onBanUser?: () => void;
  username: string;
}

const MAX_RECENT_USER_MESSAGES = 5;

function getRecentUserMessages(login?: string, username?: string) {
  const target =
    normaliseChatUsername(login) || normaliseChatUsername(username);

  if (!target) {
    return [];
  }

  const messages = chatStore$.messages.peek();

  const recentMessages: {
    key: string;
    tokens: MessageToken[];
    timestamp?: string;
  }[] = [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (!message) {
      continue;
    }

    const messageLogin = normaliseChatUsername(
      message.userstate?.login || message.userstate?.username || message.sender,
    );

    if (messageLogin !== target) {
      continue;
    }

    // The text check only filters out empty messages; the row renders the
    // tokens so emotes show as images.
    if (!replaceEmotesWithText(message.message).trim()) {
      continue;
    }

    recentMessages.push({
      key: getChatMessageStoreId(message),
      tokens: message.message,
      timestamp: message.timestamp,
    });

    if (recentMessages.length >= MAX_RECENT_USER_MESSAGES) {
      break;
    }
  }

  return recentMessages.reverse();
}

/**
 * Report and block, shown only when the caller supplied a handler.
 */
function buildSafetyActions({
  onBlockUser,
  onReportUser,
}: Pick<UserActionSheetProps, 'onBlockUser' | 'onReportUser'>): SheetAction[] {
  return [
    ...(onReportUser
      ? [{ icon: 'flag' as const, label: 'Report user', onPress: onReportUser }]
      : []),
    ...(onBlockUser ? [blockUserAction(onBlockUser)] : []),
  ];
}

interface BuildModerationActionsOptions {
  canModerate: boolean;
  onBanUser?: () => void;
  onTimeoutUser?: () => void;
  onWarnUser?: () => void;
}

function buildModerationActions({
  canModerate,
  onBanUser,
  onTimeoutUser,
  onWarnUser,
}: BuildModerationActionsOptions): SheetAction[] {
  if (!canModerate) {
    return [];
  }

  return [
    {
      icon: 'exclamationmark.triangle',
      label: 'Warn user',
      onPress: () => onWarnUser?.(),
    },
    timeoutUserAction(() => onTimeoutUser?.()),
    banUserAction(() => onBanUser?.()),
  ];
}

interface QuickAction {
  /**
   * Stable across renders. The icon and label of a toggle change when it
   * flips, and a key built from them would remount the button.
   */
  id: string;
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  /**
   * Marks a toggle that is on. The label also changes, so the state never
   * relies on colour alone.
   */
  active?: boolean;
}

/**
 * The row of round shortcuts below the header, for the actions people reach
 * for most.
 */
function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View style={styles.quickActions}>
      {actions.map(action => (
        <Button
          key={action.id}
          label={action.label}
          haptic='selection'
          accessibilityState={{ selected: Boolean(action.active) }}
          onPress={action.onPress}
          style={styles.quickAction}
        >
          <View
            style={[
              styles.quickActionCircle,
              action.active ? styles.quickActionCircleActive : null,
            ]}
          >
            <SymbolView
              name={action.icon}
              size={20}
              weight='medium'
              tintColor={
                action.active ? theme.colorWhite : theme.color.text.dark
              }
            />
          </View>
          <Text
            type='caption'
            color='gray.textLow'
            align='center'
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </Button>
      ))}
    </View>
  );
}

function UserActionSheetComponent({
  color,
  login,
  userId,
  moderation,
  visibility,
  onClose,
  onCopyUsername,
  onHideUser,
  onHighlightUser,
  onMentionUser,
  onBlockUser,
  onReportUser,
  onTimeoutUser,
  onWarnUser,
  onBanUser,
  username,
}: UserActionSheetProps) {
  const { canModerateChat, canModerateUser } = moderation;
  const { isHidden, isHighlighted, visible } = visibility;
  const sheetRef = useRef<BottomSheetHandle>(null);

  const requestClose = () => {
    sheetRef.current?.requestClose();
  };

  const runAndClose = (action?: () => void) => {
    action?.();
    requestClose();
  };

  // peek() on open: the scrollback updates constantly and re-rendering the
  // sheet per message would defeat the chat flush batching.
  const recentMessages = useMemo(
    () => (visible ? getRecentUserMessages(login, username) : []),
    [login, username, visible],
  );

  const withClose = (action: SheetAction): SheetAction => ({
    ...action,
    onPress: () => runAndClose(action.onPress),
  });

  const actionSections = [
    {
      key: 'safety',
      actions: buildSafetyActions({ onBlockUser, onReportUser }),
    },
    {
      key: 'moderation',
      title: 'Moderation',
      actions: buildModerationActions({
        canModerate: Boolean(canModerateChat && canModerateUser),
        onBanUser,
        onTimeoutUser,
        onWarnUser,
      }),
    },
  ].filter(section => section.actions.length > 0);

  const quickActions: QuickAction[] = [
    {
      id: 'mention',
      icon: 'at',
      label: 'Mention',
      onPress: () => runAndClose(onMentionUser),
    },
    {
      id: 'copy-name',
      icon: 'doc.on.doc',
      label: 'Copy name',
      onPress: () => runAndClose(onCopyUsername),
    },
    {
      id: 'highlight',
      icon: isHighlighted ? 'star.fill' : 'star',
      label: isHighlighted ? 'Highlighted' : 'Highlight',
      active: isHighlighted,
      onPress: () => runAndClose(onHighlightUser),
    },
    {
      id: 'hide',
      icon: 'eye.slash',
      label: isHidden ? 'Hidden' : 'Hide',
      active: isHidden,
      onPress: () => runAndClose(onHideUser),
    },
  ];

  const { height: windowHeight } = useWindowDimensions();

  const rowCount = actionSections.reduce(
    (count, section) => count + section.actions.length,
    0,
  );

  const sectionCount = actionSections.length;

  const recentMessagesHeight =
    recentMessages.length > 0 ? 64 + recentMessages.length * 30 : 0;

  // Header, quick actions and padding, then each row and section on top.
  const sheetHeight = Math.min(
    Math.round(windowHeight * 0.72),
    232 + recentMessagesHeight + rowCount * 57 + sectionCount * 50,
  );

  const snapPoints: SnapPoint[] = [{ height: sheetHeight }, 'full'];

  return (
    <BottomSheet
      ref={sheetRef}
      enableFixedSnapPoints
      isPresented={visible}
      onDismiss={onClose}
      showDragIndicator
      snapPoints={snapPoints}
      testID='user-action-sheet'
    >
      <View
        style={[styles.wrapper, { maxHeight: sheetHeight - theme.space16 }]}
      >
        <SheetHeader onClose={requestClose}>
          <UserCardHeader
            fallbackColor={color}
            login={login}
            userId={userId}
            username={username}
          />
        </SheetHeader>

        <QuickActions actions={quickActions} />

        <ScrollView
          nestedScrollEnabled
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {recentMessages.length > 0 ? (
            <SettingsSection
              title='Recent messages'
              cardColor={theme.color.surfaceElevated.dark}
            >
              <View style={styles.recentMessages}>
                {recentMessages.map(message => (
                  <MessageTokenLine
                    key={message.key}
                    tokens={message.tokens}
                    emoteSize={22}
                    textStyle={styles.recentMessageText}
                    style={styles.recentMessage}
                  >
                    {message.timestamp ? (
                      <Text
                        family='brand'
                        style={styles.recentMessageTimestamp}
                      >
                        {`${message.timestamp}  `}
                      </Text>
                    ) : null}
                  </MessageTokenLine>
                ))}
              </View>
            </SettingsSection>
          ) : null}

          {/* eslint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- at most two fixed groups of rows, not a data list */}
          {actionSections.map(section => (
            <SheetActionGroup
              key={section.key}
              title={section.title}
              actions={section.actions.map(withClose)}
            />
          ))}

          <ChatDebugSection
            build={() => ({
              payload: getChatDebugUserSnapshot(login, username, userId),
              ircLines: getChatDebugIrcLinesForLogin(login || username),
            })}
          />
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const UserActionSheet = memo(UserActionSheetComponent);

const styles = StyleSheet.create({
  quickAction: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  quickActionCircle: {
    alignItems: 'center',
    backgroundColor: theme.color.surfaceElevated.dark,
    borderRadius: theme.radius.full,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  quickActionCircleActive: {
    backgroundColor: theme.color.accent.dark,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.space8,
  },
  recentMessages: {
    gap: 4,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  /**
   * Two lines at most, so one long message cannot push the actions away.
   */
  recentMessage: {
    maxHeight: 48,
    overflow: 'hidden',
  },
  recentMessageText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    lineHeight: 24,
  },
  recentMessageTimestamp: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
  },
  scroll: {
    flexGrow: 0,
  },
  /**
   * No gap: each `SettingsSection` carries its own bottom margin.
   */
  scrollContent: {
    paddingBottom: theme.space16,
  },
  wrapper: {
    alignSelf: 'stretch',
    gap: theme.space20,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
    width: '100%',
  },
});
