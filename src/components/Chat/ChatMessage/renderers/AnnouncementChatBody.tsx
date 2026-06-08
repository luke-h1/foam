import { View } from 'react-native';

import { styles } from '../RichChatMessage.styles';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import { UserChatBody } from './UserChatBody';
import type { UseChatMessagePartRendererArgs } from './chatMessagePartRenderer.types';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';

interface AnnouncementChatBodyProps extends UseChatMessagePartRendererArgs {
  accentColor?: string;
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string;
  compact: boolean;
  getMappingKey: (id: string, index: number) => string;
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
  compact,
  getMappingKey,
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
        compact={compact}
        icon='megaphone.fill'
        label='Announcement'
        labelColor={resolvedAccentColor}
        labelStyle={styles.announcementMetaText}
      />
      <UserChatBody
        badgeList={badgeList}
        cachedSenderColor={cachedSenderColor}
        compact={compact}
        getMappingKey={getMappingKey}
        onUsernamePress={onUsernamePress}
        replyFlags={{
          canJumpToReplyTarget: false,
          isFirstMessage: false,
          isReplyingToCurrentUser: false,
          shouldRenderInlineReply: false,
          showChannelPointsRewardChrome: false,
          showTimestamp,
        }}
        rewardSummaryTitle=''
        timestamp={timestamp}
        userId={userId}
        userstateColor={userstateColor}
        username={username}
        {...rendererArgs}
      />
    </View>
  );
}
