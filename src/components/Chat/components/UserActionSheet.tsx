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
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { getRecentUserMessages } from '../util/getRecentUserMessages';
import {
  type UserActionItem,
  UserActionSheetRows,
} from './UserActionSheetRows';
import { UserCardHeader } from './UserCardHeader';
import { UserRecentMessages } from './UserRecentMessages';

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
            style={[
              styles.doneButton,
              {
                backgroundColor:
                  scheme === 'dark'
                    ? 'rgba(255,255,255,0.14)'
                    : 'rgba(0,0,0,0.08)',
              },
            ]}
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
              <View
                style={[
                  styles.statePill,
                  {
                    backgroundColor: theme.color.surfaceAlpha[scheme],
                    borderColor: theme.color.border[scheme],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statePillText,
                    { color: theme.color.textSecondary[scheme] },
                  ]}
                  weight='semibold'
                >
                  Hidden
                </Text>
              </View>
            ) : null}
            {isHighlighted ? (
              <View
                style={[
                  styles.statePill,
                  {
                    backgroundColor: theme.color.accentSurface[scheme],
                    borderColor:
                      scheme === 'dark'
                        ? 'rgba(46,134,255,0.34)'
                        : theme.color.accentRing.light,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statePillText,
                    { color: theme.color.accent[scheme] },
                  ]}
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
          <UserRecentMessages messages={recentMessages} />
          <UserActionSheetRows actions={actionRows} />
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

export const UserActionSheet = memo(UserActionSheetComponent);

const styles = StyleSheet.create({
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
