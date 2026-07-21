import { memo, useMemo, useRef } from 'react';
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
  type SnapPoint,
} from '@app/components/BottomSheet/BottomSheet';
import { Button } from '@app/components/Button/Button';
import type {
  ChatModerationAccessFlags,
  UserActionVisibilityFlags,
} from '@app/components/Chat/types/chatUiFlags';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { theme } from '@app/styles/themes';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

import { UserCardHeader } from './UserCardHeader';

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
  onWarnUser,
  onBanUser,
  username,
}: UserActionSheetProps) {
  const { t } = useTranslation(['chat', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const colorStyles = useMemo(
    () => ({
      accentIconFrame: { backgroundColor: theme.color.accentSurface[scheme] },
      accentText: { color: theme.color.accent[scheme] },
      actionBorder: { borderBottomColor: theme.color.border[scheme] },
      dangerIconFrame: { backgroundColor: theme.color.dangerSurface[scheme] },
      dangerText: { color: theme.color.danger[scheme] },
      doneButton: {
        backgroundColor:
          scheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
      },
      iconFrame: { backgroundColor: theme.color.surfaceAlpha[scheme] },
      primaryText: { color: theme.color.text[scheme] },
      secondaryText: { color: theme.color.textSecondary[scheme] },
      statePill: {
        backgroundColor: theme.color.surfaceAlpha[scheme],
        borderColor: theme.color.border[scheme],
      },
      statePillAccent: {
        backgroundColor: theme.color.accentSurface[scheme],
        borderColor:
          scheme === 'dark'
            ? 'rgba(46,134,255,0.34)'
            : theme.color.accentRing.light,
      },
      surface: { backgroundColor: theme.color.surfaceAlpha[scheme] },
      warningIconFrame: {
        backgroundColor:
          scheme === 'dark' ? 'rgba(224,163,58,0.16)' : 'rgba(200,133,26,0.14)',
      },
    }),
    [scheme],
  );
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
  const actionRows: UserActionItem[] = [
    {
      icon: 'at',
      label: t('userActions.mention'),
      onPress: () => runAndClose(onMentionUser),
      subtitle: t('userActions.mentionSubtitle'),
      tone: 'accent',
    },
    {
      icon: 'doc.on.doc',
      label: t('userActions.copyUsername'),
      onPress: () => runAndClose(onCopyUsername),
      subtitle: t('userActions.copyUsernameSubtitle'),
    },
    {
      icon: 'person.crop.circle.badge.xmark',
      label: isHidden ? t('userActions.unhideUser') : t('userActions.hideUser'),
      onPress: () => runAndClose(onHideUser),
      subtitle: isHidden
        ? t('userActions.unhideUserSubtitle')
        : t('userActions.hideUserSubtitle'),
    },
    {
      icon: 'star',
      label: isHighlighted
        ? t('userActions.unhighlightUser')
        : t('userActions.highlightUser'),
      onPress: () => runAndClose(onHighlightUser),
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
            onPress: () => runAndClose(onReportUser),
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
            onPress: () => runAndClose(onBlockUser),
            subtitle: t('userActions.blockUserSubtitle'),
            tone: 'danger' as const,
          },
        ]
      : []),
    ...(canModerateChat && canModerateUser
      ? [
          {
            icon: 'exclamationmark.triangle' as const,
            label: t('userActions.warnUser'),
            onPress: () => runAndClose(onWarnUser),
            subtitle: t('userActions.warnUserSubtitle'),
            tone: 'warning' as const,
          },
          {
            icon: 'clock' as const,
            label: t('userActions.timeoutUser'),
            onPress: () => runAndClose(onTimeoutUser),
            subtitle: t('userActions.timeoutUserSubtitle'),
            tone: 'warning' as const,
          },
          {
            icon: 'slash.circle' as const,
            label: t('userActions.banUser'),
            onPress: () => runAndClose(onBanUser),
            subtitle: t('userActions.banUserSubtitle'),
            tone: 'danger' as const,
          },
        ]
      : []),
  ];
  const { height: windowHeight } = useWindowDimensions();
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
            style={[styles.doneButton, colorStyles.doneButton]}
            onPress={requestClose}
          >
            <SymbolView
              name='xmark'
              size={15}
              weight='semibold'
              tintColor={theme.color.textSecondary[scheme]}
            />
          </Button>
        </View>
        {isHidden || isHighlighted ? (
          <View style={styles.statePills}>
            {isHidden ? (
              <View style={[styles.statePill, colorStyles.statePill]}>
                <Text
                  style={[styles.statePillText, colorStyles.secondaryText]}
                  weight='semibold'
                >
                  Hidden
                </Text>
              </View>
            ) : null}
            {isHighlighted ? (
              <View style={[styles.statePill, colorStyles.statePillAccent]}>
                <Text
                  style={[styles.statePillText, colorStyles.accentText]}
                  weight='semibold'
                >
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
            <View style={[styles.recentMessages, colorStyles.surface]}>
              <Text
                style={[styles.recentMessagesTitle, colorStyles.secondaryText]}
                weight='semibold'
              >
                {t('userActions.recentMessages')}
              </Text>
              {recentMessages.map(message => (
                <Text
                  key={message.key}
                  numberOfLines={1}
                  style={[styles.recentMessageText, colorStyles.primaryText]}
                >
                  {message.timestamp ? (
                    <Text
                      style={[
                        styles.recentMessageTimestamp,
                        colorStyles.secondaryText,
                      ]}
                    >
                      {`${message.timestamp}  `}
                    </Text>
                  ) : null}
                  {message.text}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={[styles.actionGroup, colorStyles.surface]}>
            {actionRows.map((action, index) => (
              <Button
                key={action.label}
                style={[
                  styles.actionButton,
                  index < actionRows.length - 1 && [
                    styles.actionButtonBorder,
                    colorStyles.actionBorder,
                  ],
                ]}
                onPress={action.onPress}
              >
                <View
                  style={[
                    styles.actionIconFrame,
                    colorStyles.iconFrame,
                    action.tone === 'accent' && colorStyles.accentIconFrame,
                    action.tone === 'warning' && colorStyles.warningIconFrame,
                    action.tone === 'danger' && colorStyles.dangerIconFrame,
                  ]}
                >
                  <SymbolView
                    name={action.icon}
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
                  />
                </View>
                <View style={styles.actionCopy}>
                  <Text
                    weight='semibold'
                    style={[
                      styles.actionText,
                      colorStyles.primaryText,
                      action.tone === 'danger' && colorStyles.dangerText,
                    ]}
                  >
                    {action.label}
                  </Text>
                  <Text
                    style={[styles.actionSubtitle, colorStyles.secondaryText]}
                  >
                    {action.subtitle}
                  </Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  actionSubtitle: {
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.3,
  },
  actionText: {
    fontSize: theme.fontSize17,
    lineHeight: theme.fontSize17 * 1.2,
  },
  doneButton: {
    alignItems: 'center',
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
    alignSelf: 'stretch',
    gap: 10,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
    width: '100%',
  },
  recentMessages: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    gap: 4,
    marginBottom: theme.space8,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  recentMessagesTitle: {
    fontSize: theme.fontSize11,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  recentMessageText: {
    fontSize: theme.fontSize12,
    lineHeight: 18,
  },
  recentMessageTimestamp: {
    fontSize: theme.fontSize11,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: theme.space16,
  },
  statePill: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: theme.space4,
  },
  statePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
  },
  statePillText: {
    fontSize: theme.fontSize11,
  },
});
