import { View } from 'react-native';

import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { styles } from '../rich-chat-message.styles';
import type { BadgePressData } from '../rich-chat-message.types';
import { ChatNoticeMetaRow } from './chat-notice-meta-row';
import type { ChatMessagePartRendererArgs } from './types/chat-message-part-renderer-args';
import { UserChatBody } from './user-chat-body';

interface AnnouncementChatBodyProps extends ChatMessagePartRendererArgs {
  accentColor?: string;
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string;
  onBadgePress?: (badge: BadgePressData) => void;
  onUsernamePress?: () => void;
  showTimestamp: boolean;
  timestamp?: string;
  userId?: string;
  userstateColor?: string;
  username?: string;
}

export function AnnouncementChatBody({
  accentColor,
  badgeList,
  cachedSenderColor,
  onBadgePress,
  onUsernamePress,
  showTimestamp,
  timestamp,
  userId,
  userstateColor,
  username,
  ...rendererArgs
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
        userId={userId}
        userstateColor={userstateColor}
        username={username}
        {...rendererArgs}
      />
    </View>
  );
}
