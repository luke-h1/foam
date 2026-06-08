import { memo } from 'react';
import { Button } from '@app/components/Button/Button';
import {
  BottomSheet,
  type SnapPoint,
} from '@app/components/BottomSheet/BottomSheet';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
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
import {
  CHAT_SHEET_BACKGROUND,
  chatSheetSurfaceStyles,
} from './SettingsSheet/SettingsSheet';

interface UserActionSheetProps {
  login?: string;
  moderation: ChatModerationAccessFlags;
  visibility: UserActionVisibilityFlags;
  onClose: () => void;
  onCopyUsername: () => void;
  onHideUser: () => void;
  onHighlightUser: () => void;
  onMentionUser: () => void;
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

function getActionToneColor(tone: UserActionItem['tone']) {
  switch (tone) {
    case 'danger':
      return theme.colorRed;
    case 'warning':
      return theme.colorAmber;
    case 'accent':
      return theme.colorPrimary;
    default:
      return '#b7bdc9';
  }
}

function UserActionSheetComponent({
  login,
  moderation,
  visibility,
  onClose,
  onCopyUsername,
  onHideUser,
  onHighlightUser,
  onMentionUser,
  onTimeoutUser,
  onBanUser,
  username,
}: UserActionSheetProps) {
  const { canModerateChat, canModerateUser } = moderation;
  const { isHidden, isHighlighted, visible } = visibility;

  const actionRows: UserActionItem[] = [
    {
      icon: 'at',
      label: 'Mention',
      onPress: onMentionUser,
      subtitle: 'Add to composer',
      tone: 'accent',
    },
    {
      icon: 'doc.on.doc',
      label: 'Copy Username',
      onPress: onCopyUsername,
      subtitle: 'Display name',
    },
    {
      icon: 'person.crop.circle.badge.xmark',
      label: isHidden ? 'Unhide User' : 'Hide User',
      onPress: onHideUser,
      subtitle: isHidden ? 'Show messages again' : 'Mute locally',
    },
    {
      icon: 'star',
      label: isHighlighted ? 'Unhighlight User' : 'Highlight User',
      onPress: onHighlightUser,
      subtitle: isHighlighted ? 'Remove marker' : 'Mark future messages',
      tone: 'accent',
    },
    ...(canModerateChat && canModerateUser
      ? [
          {
            icon: 'clock' as const,
            label: 'Timeout User',
            onPress: onTimeoutUser,
            subtitle: 'Type /timeout in chat',
            tone: 'warning' as const,
          },
          {
            icon: 'slash.circle' as const,
            label: 'Ban User',
            onPress: onBanUser,
            subtitle: 'Permanent moderation',
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

  const maxScrollHeight = Math.min(
    Math.round(windowHeight * 0.54),
    actionRows.length * 52 + 2,
  );

  const sheetHeight = Math.min(
    Math.round(windowHeight * 0.72),
    144 + actionRows.length * 52 + (isHidden || isHighlighted ? 34 : 0),
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
            <View style={styles.identityText}>
              <Text style={styles.eyebrow} weight='semibold'>
                User actions
              </Text>
              <Text style={styles.username} weight='semibold' numberOfLines={1}>
                {username}
              </Text>
              {login && login !== username ? (
                <Text style={styles.login} numberOfLines={1}>
                  @{login}
                </Text>
              ) : null}
            </View>
          </View>
          <Button label='Done' style={styles.doneButton} onPress={onClose}>
            <SymbolView
              name='checkmark'
              size={18}
              tintColor={theme.color.text.dark}
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
                    tintColor={getActionToneColor(action.tone)}
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
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 52,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  actionButtonBorder: {
    borderBottomColor: 'rgba(255,255,255,0.075)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionGroup: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionIconAccent: {
    backgroundColor: 'rgba(26, 201, 162, 0.12)',
    borderColor: 'rgba(26, 201, 162, 0.18)',
  },
  actionIconDanger: {
    backgroundColor: theme.colorRedSurface,
    borderColor: theme.colorRedBorderUi,
  },
  actionIconFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.075)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  actionIconWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.26)',
  },
  actionSubtitle: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    lineHeight: theme.fontSize11 * 1.25,
  },
  actionText: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
    lineHeight: theme.fontSize14 * 1.25,
  },
  actionTextDanger: {
    color: theme.colorRed,
  },
  doneButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.075)',
    borderColor: 'rgba(255,255,255,0.085)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  eyebrow: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0,
    textTransform: 'uppercase',
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
  identityText: {
    flex: 1,
    gap: 1,
  },
  login: {
    color: theme.color.textSecondary.dark,
    fontSize: 13,
    lineHeight: theme.fontSize14 * 1.25,
  },
  username: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize18,
    lineHeight: theme.fontSize18 * 1.2,
  },
  wrapper: {
    ...chatSheetSurfaceStyles,
    backgroundColor: CHAT_SHEET_BACKGROUND,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: theme.space12,
    paddingTop: theme.space8,
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
    backgroundColor: theme.colorAccentSurface,
    borderColor: 'rgba(26, 201, 162, 0.24)',
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
