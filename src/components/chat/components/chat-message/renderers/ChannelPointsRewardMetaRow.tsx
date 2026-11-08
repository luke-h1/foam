import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/util/chatNoticeAccents';
import { resolveChannelPointRewardTitle } from '@app/store/chat/actions/channelPointRewardTitleStore';
import { useChannelPointRewardTitleRevision } from '@app/store/chat/react/use-channel-point-reward-title-revision';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { channelPointsRewardTitleFieldsFromUserstate } from '@app/utils/chat/channel-points-reward-title/channelPointsRewardTitleFieldsFromUserstate';
import { channelPointsRewardTitleFromTags } from '@app/utils/chat/channel-points-reward-title/channelPointsRewardTitleFromTags';
import { channelPointsRewardTitleFromUserstate } from '@app/utils/chat/channel-points-reward-title/channelPointsRewardTitleFromUserstate';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';

interface ChannelPointsRewardMetaRowProps {
  density: ChatDensity;
  fontScale?: ChatFontScale;
  isHighlightedMessage?: boolean;
  isModerated: boolean;
  noticeTags?: UserNoticeTags;
  roomId?: string;
  username?: string;
  userstate: UserStateTags;
}

export function ChannelPointsRewardMetaRow({
  density,
  fontScale,
  isHighlightedMessage,
  isModerated,
  noticeTags,
  roomId,
  username,
  userstate,
}: ChannelPointsRewardMetaRowProps) {
  useChannelPointRewardTitleRevision();

  const textStyles = getChatTextStyles(fontScale, density);

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
          density,
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
      {...{ density, fontScale, labelColor: CHAT_NOTICE_ACCENTS.channelPoints }}
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
            isModerated && styles.moderatedMessageText,
          ]}
        >
          {username}
        </ChatText>
        <ChatText
          style={[
            textStyles.meta,
            styles.channelPointsMetaMuted,
            isModerated && styles.moderatedMessageText,
          ]}
        >
          {' '}
          redeemed{' '}
        </ChatText>
        <ChatText
          style={[
            textStyles.meta,
            styles.channelPointsMetaReward,
            isModerated && styles.moderatedMessageText,
          ]}
        >
          {rewardSummaryTitle}
        </ChatText>
      </ChatText>
    </ChatNoticeMetaRow>
  );
}
