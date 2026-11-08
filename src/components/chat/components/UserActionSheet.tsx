import { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@app/components/button/Button';
import { ChatDebugSection } from '@app/components/chat/components/ChatDebugSection';
import { MessageTokenLine } from '@app/components/chat/components/message-token-line/MessageTokenLine';
import { ChatSheet } from '@app/components/chat/components/sheet/ChatSheet';
import { chatSheetStyles } from '@app/components/chat/components/sheet/ChatSheet.styles';
import { useChatSheet } from '@app/components/chat/components/sheet/hooks/use-chat-sheet';
import { useChatSheetHeight } from '@app/components/chat/components/sheet/hooks/use-chat-sheet-height';
import { SheetHeader } from '@app/components/chat/components/sheet/SheetHeader';
import {
  type ChatSheetLayout,
  SHEET_CHROME,
} from '@app/components/chat/components/sheet/util/chatSheetLayout';
import {
  type SheetAction,
  SheetActionGroup,
} from '@app/components/chat/components/SheetActionGroup';
import type {
  ChatModerationAccessFlags,
  UserActionVisibilityFlags,
} from '@app/components/chat/types/chat-ui-flags';
import {
  banUserAction,
  blockUserAction,
  timeoutUserAction,
} from '@app/components/chat/util/userSheetActions';
import { SettingsSection } from '@app/components/settings-section/SettingsSection';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import {
  getChatDebugIrcLinesForLogin,
  getChatDebugUserSnapshot,
} from '@app/store/chat/actions/chat-debug-log';
import { getMessageSenderLogin } from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/types/chat/messageToken';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { getChatMessageStoreId } from '@app/utils/chat/message-identity/getChatMessageStoreId';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

import { UserCardHeader } from './UserCardHeader';

interface UserActionSheetProps {
  color?: string;
  login?: string;
  userId?: string;
  moderation: ChatModerationAccessFlags;
  visibility: Pick<UserActionVisibilityFlags, 'isHidden' | 'isHighlighted'>;
  onDismiss: () => void;
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

const RECENT_MESSAGE_LINE_HEIGHT = 24;

/**
 * Two lines at most, so one long message cannot push the actions away.
 */
const RECENT_MESSAGE_MAX_LINES = 2;

/**
 * Uses the same sender rule as the chat row, so the sheet finds the messages
 * the row attributes to this user.
 */
function getRecentUserMessages(login?: string, username?: string) {
  const target = normaliseChatUsername(login || username);

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

    if (getMessageSenderLogin(message) !== target) {
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
  onDismiss,
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
  const { isHidden, isHighlighted } = visibility;
  const { requestClose, runAndClose, sheetRef } = useChatSheet();

  // peek() on open: the scrollback updates constantly and re-rendering the
  // sheet per message would defeat the chat flush batching.
  const recentMessages = useMemo(
    () => getRecentUserMessages(login, username),
    [login, username],
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

  const recentMessagesHeight =
    recentMessages.length > 0
      ? SHEET_CHROME.recentMessagesSection +
        recentMessages.length * SHEET_CHROME.recentMessageLine
      : 0;

  const layout: ChatSheetLayout = {
    chromeHeight: SHEET_CHROME.userCard + recentMessagesHeight,
    expandable: true,
    kind: 'content',
    sections: actionSections.map(section => ({
      rowCount: section.actions.length,
      titled: Boolean(section.title),
    })),
  };

  const sheetHeight = useChatSheetHeight(layout);

  return (
    <ChatSheet
      ref={sheetRef}
      onDismiss={onDismiss}
      layout={layout}
      testID='user-action-sheet'
    >
      <View
        style={[
          chatSheetStyles.wrapper,
          { maxHeight: sheetHeight - theme.space16 },
        ]}
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
          style={chatSheetStyles.scroll}
          contentContainerStyle={chatSheetStyles.scrollContent}
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

          {/* oxlint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- at most two fixed groups of rows, not a data list */}
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
    </ChatSheet>
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
  recentMessage: {
    maxHeight: RECENT_MESSAGE_MAX_LINES * RECENT_MESSAGE_LINE_HEIGHT,
    overflow: 'hidden',
  },
  recentMessageText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    lineHeight: RECENT_MESSAGE_LINE_HEIGHT,
  },
  recentMessageTimestamp: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
  },
});
