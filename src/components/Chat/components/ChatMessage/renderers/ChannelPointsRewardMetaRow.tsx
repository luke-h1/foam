import { Text } from '@app/components/ui/Text/Text';
import {
  channelPointsRewardTitleFromTags,
  channelPointsRewardTitleFromUserstate,
  channelPointsRewardTitleFieldsFromUserstate,
} from '@app/utils/chat/channelPointsRewardTitle';
import {
  getChannelPointRewardTitleCacheVersion,
  resolveChannelPointRewardTitle,
  subscribeChannelPointRewardTitles,
} from '@app/utils/chat/channelPointRewardTitleStore';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { useSyncExternalStore } from 'react';

import { CHAT_NOTICE_ACCENTS } from '../../util/chatNoticeAccents';
import { styles } from '../RichChatMessage.styles';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';

interface ChannelPointsRewardMetaRowProps {
  compact: boolean;
  isHighlightedMessage?: boolean;
  moderationNotice?: unknown;
  noticeTags?: UserNoticeTags;
  roomId?: string;
  username?: string;
  userstate: UserStateTags;
}

export function ChannelPointsRewardMetaRow({
  compact,
  isHighlightedMessage,
  moderationNotice,
  noticeTags,
  roomId,
  username,
  userstate,
}: ChannelPointsRewardMetaRowProps) {
  useSyncExternalStore(
    subscribeChannelPointRewardTitles,
    getChannelPointRewardTitleCacheVersion,
    getChannelPointRewardTitleCacheVersion,
  );

  const rewardSummaryTitle =
    channelPointsRewardTitleFromUserstate(userstate) ??
    (noticeTags ? channelPointsRewardTitleFromTags(noticeTags) : undefined) ??
    resolveChannelPointRewardTitle({
      tags: channelPointsRewardTitleFieldsFromUserstate(userstate),
      broadcasterId: roomId,
    }) ??
    'Channel Points reward';

  if (isHighlightedMessage) {
    return (
      <ChatNoticeMetaRow
        compact={compact}
        icon='sparkles'
        label={rewardSummaryTitle}
        labelColor={CHAT_NOTICE_ACCENTS.highlight}
        labelStyle={styles.highlightMyMessageMetaText}
      />
    );
  }

  return (
    <ChatNoticeMetaRow
      compact={compact}
      icon='gift.fill'
      labelColor={CHAT_NOTICE_ACCENTS.channelPoints}
    >
      <Text
        style={[
          styles.messageMetaText,
          styles.messageMetaTextStrong,
          styles.channelPointsMetaText,
          compact && styles.messageMetaTextCompact,
        ]}
      >
        <Text
          style={
            moderationNotice
              ? [styles.channelPointsMetaName, styles.moderatedMessageText]
              : styles.channelPointsMetaName
          }
        >
          {username}
        </Text>
        <Text
          style={
            moderationNotice
              ? [styles.channelPointsMetaMuted, styles.moderatedMessageText]
              : styles.channelPointsMetaMuted
          }
        >
          {' '}
          redeemed{' '}
        </Text>
        <Text
          style={
            moderationNotice
              ? [styles.channelPointsMetaReward, styles.moderatedMessageText]
              : styles.channelPointsMetaReward
          }
        >
          {rewardSummaryTitle}
        </Text>
      </Text>
    </ChatNoticeMetaRow>
  );
}
