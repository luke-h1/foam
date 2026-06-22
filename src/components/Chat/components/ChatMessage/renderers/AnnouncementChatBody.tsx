import { View } from 'react-native';

import i18next from '@app/i18n/i18next';
import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';

import { styles } from '../RichChatMessage.styles';
import type { BadgePressData } from '../RichChatMessage.types';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';
import { UserChatBody } from './UserChatBody';

interface AnnouncementChatBodyProps extends UseChatMessagePartRendererArgs {
  accentColor?: string;
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string;
  compact: boolean;
  getMappingKey: (id: string, index: number) => string;
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
  compact,
  getMappingKey,
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
        compact={compact}
        icon='megaphone.fill'
        label={i18next.t('chat:notices.announcement')}
        labelColor={resolvedAccentColor}
        labelStyle={styles.announcementMetaText}
      />
      <UserChatBody
        badgeList={badgeList}
        cachedSenderColor={cachedSenderColor}
        compact={compact}
        getMappingKey={getMappingKey}
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
