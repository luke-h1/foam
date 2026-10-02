import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/components/util/chat-notice-accents';
import { useChannelPointRewardTitleRevision } from '@app/store/chat/react/use-channel-point-reward-title-revision';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { resolveChannelPointRewardTitle } from '@app/utils/chat/channel-point-reward-title-store';
import { channelPointsRewardTitleFieldsFromUserstate } from '@app/utils/chat/channel-points-reward-title/channel-points-reward-title-fields-from-userstate';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channel-points-reward-title/channel-points-reward-title-from-tags';
import { channelPointsRewardTitleFromUserstate } from '@app/utils/chat/channel-points-reward-title/channel-points-reward-title-from-userstate';

import { styles } from '../chat-row.styles';
import { getChatTextStyles } from '../chat-text.styles';
import type { ChatFontScale } from '../util/chat-scale';
import { ChatNoticeMetaRow } from './chat-notice-meta-row';

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
