import { View } from 'react-native';

import type { BadgePressData } from '@app/store/chat/types/chat-press-data';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import { UserChatBody } from './UserChatBody';

interface AnnouncementChatBodyProps {
  accentColor?: string;
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string;
  onBadgePress?: (badge: BadgePressData) => void;
  onUsernamePress?: () => void;
  showTimestamp: boolean;
  timestamp?: string;
  tokenRenderProps: ChatTokenRenderProps;
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
  tokenRenderProps: rendererArgs,
  userId,
  userstateColor,
  username,
}: AnnouncementChatBodyProps) {
  const resolvedAccentColor = accentColor ?? styles.announcementMetaText.color;

  return (
    <View
      style={[
        styles.announcementColumn,
        getChatTextStyles(rendererArgs.fontScale, rendererArgs.density)
          .stackGap,
      ]}
    >
      <ChatNoticeMetaRow
        density={rendererArgs.density}
        fontScale={rendererArgs.fontScale}
        icon='megaphone.fill'
        label='Announcement'
        labelColor={resolvedAccentColor}
        labelStyle={styles.announcementMetaText}
      />
      <UserChatBody
        replyFlags={{
          canJumpToReplyTarget: false,
          isFirstMessage: false,
          isReplyingToCurrentUser: false,
          shouldRenderInlineReply: false,
          showChannelPointsRewardChrome: false,
          showTimestamp,
        }}
        {...{
          badgeList,
          cachedSenderColor,
          onBadgePress,
          onUsernamePress,
          timestamp,
          tokenRenderProps: rendererArgs,
          userId,
          userstateColor,
          username,
        }}
      />
    </View>
  );
}
