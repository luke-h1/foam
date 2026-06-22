import { memo, useMemo } from 'react';
import { Button } from '@app/components/Button/Button';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import {
  BottomSheet,
  type SnapPoint,
} from '@app/components/BottomSheet/BottomSheet';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type {
  ChatModerationAccessFlags,
  UserActionVisibilityFlags,
} from '@app/components/Chat/types/chatUiFlags';
import { UserCardHeader } from './UserCardHeader';
import { useTranslation } from 'react-i18next';

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
  onBanUser?: () => void;
  username: string;
}

type UserActionItem = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress?: () => void;
  subtitle: string;
  tone?: 'accent' | 'danger' | 'default' | 'warning';
};

const MAX_RECENT_USER_MESSAGES = 5;

function normaliseLogin(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function getRecentUserMessages(login?: string, username?: string) {
  const target = normaliseLogin(login) || normaliseLogin(username);
  if (!target) {
    return [];
  }

  const messages = chatStore$.messages.peek();
  const recentMessages: { key: string; text: string; timestamp?: string }[] =
    [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) {
      continue;
    }

    const messageLogin = normaliseLogin(
      message.userstate?.login || message.userstate?.username || message.sender,
    );
    if (messageLogin !== target) {
      continue;
    }

    const text = replaceEmotesWithText(message.message).trim();
    if (!text) {
      continue;
    }

    recentMessages.push({
      key: message.id ?? `${message.message_id}_${message.message_nonce}`,
      text,
      timestamp: message.timestamp,
    });

    if (recentMessages.length >= MAX_RECENT_USER_MESSAGES) {
      break;
    }
  }

  return recentMessages.reverse();
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
  onBanUser,
  username,
}: UserActionSheetProps) {
  const { t } = useTranslation(['chat', 'common']);
  const { canModerateChat, canModerateUser } = moderation;
  const { isHidden, isHighlighted, visible } = visibility;
  // peek() on open: the scrollback updates constantly and re-rendering the
  // sheet per message would defeat the chat flush batching.
  const recentMessages = useMemo(
    () => (visible ? getRecentUserMessages(login, username) : []),
    [login, username, visible],
  );
  const actionRows: UserActionItem[] = [
    {
      icon: 'at',
      label: t('userActions.mention'),
      onPress: onMentionUser,
      subtitle: t('userActions.mentionSubtitle'),
      tone: 'accent',
    },
    {
      icon: 'doc.on.doc',
      label: t('userActions.copyUsername'),
      onPress: onCopyUsername,
      subtitle: t('userActions.copyUsernameSubtitle'),
    },
    {
      icon: 'person.crop.circle.badge.xmark',
      label: isHidden ? t('userActions.unhideUser') : t('userActions.hideUser'),
      onPress: onHideUser,
      subtitle: isHidden
        ? t('userActions.unhideUserSubtitle')
        : t('userActions.hideUserSubtitle'),
    },
    {
      icon: 'star',
      label: isHighlighted
        ? t('userActions.unhighlightUser')
        : t('userActions.highlightUser'),
      onPress: onHighlightUser,
      subtitle: isHighlighted
        ? t('userActions.unhighlightUserSubtitle')
        : t('userActions.highlightUserSubtitle'),
      tone: 'accent',
    },
    ...(onReportUser
      ? [
          {
            icon: 'flag' as const,
            label: t('userActions.reportUser'),
            onPress: onReportUser,
            subtitle: t('userActions.reportUserSubtitle'),
            tone: 'warning' as const,
          },
        ]
      : []),
    ...(onBlockUser
      ? [
          {
            icon: 'nosign' as const,
            label: t('userActions.blockUser'),
            onPress: onBlockUser,
            subtitle: t('userActions.blockUserSubtitle'),
            tone: 'danger' as const,
          },
        ]
      : []),
    ...(canModerateChat && canModerateUser
      ? [
          {
            icon: 'clock' as const,
            label: t('userActions.timeoutUser'),
            onPress: onTimeoutUser,
            subtitle: t('userActions.timeoutUserSubtitle'),
            tone: 'warning' as const,
          },
          {
            icon: 'slash.circle' as const,
            label: t('userActions.banUser'),
            onPress: onBanUser,
            subtitle: t('userActions.banUserSubtitle'),
            tone: 'danger' as const,
          },
        ]
      : []),
  ];
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const sheetWidth = Math.max(
    280,
    Math.min(windowWidth - theme.space16 * 2, 520),
  );
  const recentMessagesHeight =
    recentMessages.length > 0 ? 40 + recentMessages.length * 22 : 0;
  const maxScrollHeight = Math.min(
    Math.round(windowHeight * 0.54),
    actionRows.length * 58 + recentMessagesHeight + 2,
  );
  const sheetHeight = Math.min(
    Math.round(windowHeight * 0.72),
    196 +
      actionRows.length * 58 +
      recentMessagesHeight +
      (isHidden || isHighlighted ? 34 : 0),
  );
  const snapPoints: SnapPoint[] = [{ height: sheetHeight }, 'full'];
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
      testID='user-action-sheet'
    >
      <View style={wrapperStyle}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <UserCardHeader
              fallbackColor={color}
              login={login}
              userId={userId}
              username={username}
            />
          </View>
          <Button
            label={t('common:done')}
            style={styles.doneButton}
            onPress={onClose}
          >
            <SymbolView
              name='xmark'
              size={15}
              weight='semibold'
              tintColor={theme.color.textSecondary.dark}
            />
          </Button>
        </View>
        {isHidden || isHighlighted ? (
          <View style={styles.statePills}>
            {isHidden ? (
              <View style={styles.statePill}>
                <Text style={styles.statePillText} weight='semibold'>
                  Hidden
                </Text>
              </View>
            ) : null}
            {isHighlighted ? (
              <View style={[styles.statePill, styles.statePillAccent]}>
                <Text style={styles.statePillAccentText} weight='semibold'>
                  Highlighted
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          style={scrollStyle}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {recentMessages.length > 0 ? (
            <View style={styles.recentMessages}>
              <Text style={styles.recentMessagesTitle} weight='semibold'>
                {t('userActions.recentMessages')}
              </Text>
              {recentMessages.map(message => (
                <Text
                  key={message.key}
                  numberOfLines={1}
                  style={styles.recentMessageText}
                >
                  {message.timestamp ? (
                    <Text style={styles.recentMessageTimestamp}>
                      {`${message.timestamp}  `}
                    </Text>
                  ) : null}
                  {message.text}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={styles.actionGroup}>
            {actionRows.map((action, index) => (
              <Button
                key={action.label}
                style={[
                  styles.actionButton,
                  index < actionRows.length - 1 && styles.actionButtonBorder,
                ]}
                onPress={action.onPress}
              >
                <View
                  style={[
                    styles.actionIconFrame,
                    action.tone === 'accent' && styles.actionIconAccent,
                    action.tone === 'warning' && styles.actionIconWarning,
                    action.tone === 'danger' && styles.actionIconDanger,
                  ]}
                >
                  <SymbolView
                    name={action.icon}
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
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </Button>
            ))}
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const UserActionSheet = memo(UserActionSheetComponent);

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: theme.space12,
    minHeight: 56,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  actionButtonBorder: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  doneButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'space-between',
    paddingBottom: theme.space4,
  },
  identity: {
    flex: 1,
  },
  wrapper: {
    alignSelf: 'center',
    gap: 10,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
  },
  recentMessages: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    gap: 4,
    marginBottom: theme.space8,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  recentMessagesTitle: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  recentMessageText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    lineHeight: 18,
  },
  recentMessageTimestamp: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: theme.space16,
  },
  statePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: theme.space4,
  },
  statePillAccent: {
    backgroundColor: 'rgba(46,134,255,0.16)',
    borderColor: 'rgba(46,134,255,0.34)',
  },
  statePillAccentText: {
    color: theme.colorPrimary,
    fontSize: theme.fontSize11,
  },
  statePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
  },
  statePillText: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
  },
});
