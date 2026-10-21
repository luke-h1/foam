import { View } from 'react-native';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { styles } from '../chat-row.styles';
import type { BadgePressData } from '../chat-row.types';
import { ChatNoticeMetaRow } from './chat-notice-meta-row';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import { UserChatBody } from './user-chat-body';

interface AnnouncementChatBodyProps {
  accentColor?: string | undefined;
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string | undefined;
  onBadgePress?: ((badge: BadgePressData) => void) | undefined;
  onUsernamePress?: (() => void) | undefined;
  showTimestamp: boolean;
  timestamp?: string | undefined;
  tokenRenderProps: ChatTokenRenderProps;
  userId?: string | undefined;
  userstateColor?: string | undefined;
  username?: string | undefined;
}

export function AnnouncementChatBody({
  accentColor,
  badgeList,
  cachedSenderColor,
  onBadgePress,
  onUsernamePress,
  showTimestamp,
  timestamp,
  tokenRenderProps: rendererArgs,
  userId,
  userstateColor,
  username,
}: AnnouncementChatBodyProps) {
  const resolvedAccentColor = accentColor ?? styles.announcementMetaText.color;

  return (
    <View style={styles.announcementColumn}>
      <ChatNoticeMetaRow
        compact={rendererArgs.compact}
        fontScale={rendererArgs.fontScale}
        icon='megaphone.fill'
        label='Announcement'
        labelColor={resolvedAccentColor}
        labelStyle={styles.announcementMetaText}
      />
      <UserChatBody
        badgeList={badgeList}
        cachedSenderColor={cachedSenderColor}
        onBadgePress={onBadgePress}
        onUsernamePress={onUsernamePress}
        replyFlags={{
          canJumpToReplyTarget: false,
          isFirstMessage: false,
          isReplyingToCurrentUser: false,
          shouldRenderInlineReply: false,
          showChannelPointsRewardChrome: false,
          showTimestamp,
        }}
        timestamp={timestamp}
        tokenRenderProps={rendererArgs}
        userId={userId}
        userstateColor={userstateColor}
        username={username}
      />
    </View>
  );
}
