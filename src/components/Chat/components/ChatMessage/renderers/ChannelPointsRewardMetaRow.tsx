import { useColorScheme } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from '@app/components/Chat/components/util/chatNoticeAccents';
import { Text } from '@app/components/ui/Text/Text';
import { resolveChannelPointRewardTitle } from '@app/store/chat/actions/channelPointRewardTitles';
import { useChannelPointRewardTitleRevision } from '@app/store/chat/react/selectors';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { channelPointsRewardTitleFieldsFromUserstate } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFieldsFromUserstate';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFromTags';
import { channelPointsRewardTitleFromUserstate } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFromUserstate';

import { getRichChatMessageStyles } from '../RichChatMessage.styles';
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const styles = getRichChatMessageStyles(scheme);
  useChannelPointRewardTitleRevision();

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
