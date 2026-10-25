import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/components/util/chatNoticeAccents';
import { useChannelPointRewardTitleRevision } from '@app/store/chat/react/use-channel-point-reward-title-revision';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { channelPointsRewardTitleFieldsFromUserstate } from '@app/utils/chat/channel-points-reward-title/channelPointsRewardTitleFieldsFromUserstate';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channel-points-reward-title/channelPointsRewardTitleFromTags';
import { channelPointsRewardTitleFromUserstate } from '@app/utils/chat/channel-points-reward-title/channelPointsRewardTitleFromUserstate';
import { resolveChannelPointRewardTitle } from '@app/utils/chat/channelPointRewardTitleStore';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import type { ChatFontScale } from '../util/chatScale';
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
        icon='sparkles'
        {...{
          compact,
          fontScale,
          label: rewardSummaryTitle,
          labelColor: CHAT_NOTICE_ACCENTS.highlight,
          labelStyle: styles.highlightMyMessageMetaText,
        }}
      />
    );
  }

  return (
    <ChatNoticeMetaRow
      icon='gift.fill'
      {...{ compact, fontScale, labelColor: CHAT_NOTICE_ACCENTS.channelPoints }}
    >
      <ChatText
        style={[
          textStyles.meta,
          styles.messageMetaTextFlex,
          textStyles.metaStrong,
          styles.channelPointsMetaText,
        ]}
      >
        <ChatText
          style={[
            textStyles.meta,
            styles.channelPointsMetaName,
            Boolean(moderationNotice) && styles.moderatedMessageText,
          ]}
        >
          {username}
        </ChatText>
        <ChatText
          style={[
            textStyles.meta,
            styles.channelPointsMetaMuted,
            Boolean(moderationNotice) && styles.moderatedMessageText,
          ]}
        >
          {' '}
          redeemed{' '}
        </ChatText>
        <ChatText
          style={[
            textStyles.meta,
            styles.channelPointsMetaReward,
            Boolean(moderationNotice) && styles.moderatedMessageText,
          ]}
        >
          {rewardSummaryTitle}
        </ChatText>
      </ChatText>
    </ChatNoticeMetaRow>
  );
}
