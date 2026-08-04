import { CHAT_NOTICE_ACCENTS } from '@app/components/Chat/components/util/chatNoticeAccents';
import { Text } from '@app/components/ui/Text/Text';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import {
  resolveChannelPointRewardTitle,
  useChannelPointRewardTitleRevision,
} from '@app/utils/chat/channelPointRewardTitleStore';
import { channelPointsRewardTitleFieldsFromUserstate } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFieldsFromUserstate';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFromTags';
import { channelPointsRewardTitleFromUserstate } from '@app/utils/chat/channelPointsRewardTitle/channelPointsRewardTitleFromUserstate';

import type { ChatFontScale } from '../chatScale';
import { getChatTextStyles } from '../chatTextStyles';
import { styles } from '../RichChatMessage.styles';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';

interface ChannelPointsRewardMetaRowProps {
  compact: boolean;
  fontScale?: ChatFontScale;
  isHighlightedMessage?: boolean;
  moderationNotice?: unknown;
  noticeTags?: UserNoticeTags;
  roomId?: string;
  username?: string;
  userstate: UserStateTags;
}

export function ChannelPointsRewardMetaRow({
  compact,
  fontScale,
  isHighlightedMessage,
  moderationNotice,
  noticeTags,
  roomId,
  username,
  userstate,
}: ChannelPointsRewardMetaRowProps) {
  useChannelPointRewardTitleRevision();

  const textStyles = getChatTextStyles(fontScale, compact);
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
        fontScale={fontScale}
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
      fontScale={fontScale}
      icon='gift.fill'
      labelColor={CHAT_NOTICE_ACCENTS.channelPoints}
    >
      <Text
        style={[
          textStyles.meta,
          styles.messageMetaTextFlex,
          textStyles.metaStrong,
          styles.channelPointsMetaText,
        ]}
      >
        <Text
          style={[
            textStyles.meta,
            styles.channelPointsMetaName,
            Boolean(moderationNotice) && styles.moderatedMessageText,
          ]}
        >
          {username}
        </Text>
        <Text
          style={[
            textStyles.meta,
            styles.channelPointsMetaMuted,
            Boolean(moderationNotice) && styles.moderatedMessageText,
          ]}
        >
          {' '}
          redeemed{' '}
        </Text>
        <Text
          style={[
            textStyles.meta,
            styles.channelPointsMetaReward,
            Boolean(moderationNotice) && styles.moderatedMessageText,
          ]}
        >
          {rewardSummaryTitle}
        </Text>
      </Text>
    </ChatNoticeMetaRow>
  );
}
