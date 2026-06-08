import { Text } from '@app/components/ui/Text/Text';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { CHAT_NOTICE_ACCENTS } from '../../util/chatNoticeAccents';
import { styles } from '../RichChatMessage.styles';
import { normaliseChatUsername } from '@app/components/Chat/util/normaliseChatUsername';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import { RichChatMessageUsername } from '../RichChatMessageUsername';
import { ChatMessageBadges } from './ChatMessageBadges';
import { ChatMessageBody } from './ChatMessageBody';
import { ReplyingToHeader } from './ReplyingToHeader';
import type { UseChatMessagePartRendererArgs } from './chatMessagePartRenderer.types';

import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';

interface UserChatBodyProps extends UseChatMessagePartRendererArgs {
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string;
  getMappingKey: (id: string, index: number) => string;
  compact: boolean;
  isChannelPointRedemption?: boolean;
  isHighlightedMessage?: boolean;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  onUsernamePress?: () => void;
  parentDisplayName?: string;
  replyBody?: string;
  replyFlags: {
    canJumpToReplyTarget: boolean;
    isFirstMessage: boolean;
    isReplyingToCurrentUser: boolean;
    shouldRenderInlineReply: boolean;
    showChannelPointsRewardChrome: boolean;
    showTimestamp: boolean;
  };
  replyParentMessageId?: string;
  rewardSummaryTitle: string;
  timestamp?: string;
  userId?: string;
  userstateColor?: string;
  username?: string;
}

export function UserChatBody({
  badgeList,
  getMappingKey,
  cachedSenderColor,
  compact,
  isChannelPointRedemption,
  isHighlightedMessage,
  message,
  moderationNotice,
  onReplyContextPress,
  onUsernamePress,
  parentDisplayName,
  replyBody,
  replyFlags,
  replyParentMessageId,
  rewardSummaryTitle,
  timestamp,
  userId,
  userstateColor,
  username,
  ...rendererArgs
}: UserChatBodyProps): ReactNode {
  const {
    canJumpToReplyTarget,
    isFirstMessage,
    isReplyingToCurrentUser,
    shouldRenderInlineReply,
    showChannelPointsRewardChrome,
    showTimestamp,
  } = replyFlags;
  const replyPlainMentionTarget = shouldRenderInlineReply
    ? normaliseChatUsername(parentDisplayName)
    : undefined;
  const replyHeaderVisible = Boolean(
    shouldRenderInlineReply && parentDisplayName,
  );

  return (
    <View style={styles.messageColumn}>
      {replyHeaderVisible ? (
        <ReplyingToHeader
          canJumpToReplyTarget={canJumpToReplyTarget}
          compact={compact}
          isReplyingToCurrentUser={isReplyingToCurrentUser}
          onReplyContextPress={onReplyContextPress}
          parentDisplayName={parentDisplayName}
          replyBody={replyBody}
          replyParentMessageId={replyParentMessageId}
          rendererArgs={{ ...rendererArgs, compact, message }}
        />
      ) : null}
      {!replyHeaderVisible && isFirstMessage ? (
        <ChatNoticeMetaRow
          compact={compact}
          icon='sparkles'
          label='First message'
          labelColor={CHAT_NOTICE_ACCENTS.firstMessage}
          labelStyle={styles.firstMessageMetaText}
        />
      ) : null}
      {showChannelPointsRewardChrome && isHighlightedMessage ? (
        <ChatNoticeMetaRow
          compact={compact}
          icon='sparkles'
          label={rewardSummaryTitle}
          labelColor={CHAT_NOTICE_ACCENTS.highlight}
          labelStyle={styles.highlightMyMessageMetaText}
        />
      ) : null}
      {showChannelPointsRewardChrome && !isHighlightedMessage ? (
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
                  ? [
                      styles.channelPointsMetaReward,
                      styles.moderatedMessageText,
                    ]
                  : styles.channelPointsMetaReward
              }
            >
              {rewardSummaryTitle}
            </Text>
          </Text>
        </ChatNoticeMetaRow>
      ) : null}
      <View
        style={[
          styles.messageLine,
          moderationNotice ? styles.messageLineModerated : null,
        ]}
      >
        {moderationNotice ? (
          <View style={styles.moderatedStrikeOverlay} />
        ) : null}
        {showTimestamp && timestamp ? (
          <Text
            tabular
            variant='mono'
            weight='bold'
            style={[styles.timestamp, compact && styles.timestampCompact]}
          >
            {timestamp}
          </Text>
        ) : null}
        <ChatMessageBadges
          badges={badgeList}
          compact={compact}
          getMappingKey={getMappingKey}
          moderationNotice={moderationNotice}
        />
        {username ? (
          <View
            style={moderationNotice ? styles.moderatedUsernameContainer : null}
          >
            <RichChatMessageUsername
              cachedSenderColor={cachedSenderColor}
              compact={compact}
              isModerated={Boolean(moderationNotice)}
              onUsernamePress={onUsernamePress}
              userId={userId}
              userstateColor={userstateColor}
              username={username}
            />
          </View>
        ) : null}
        <ChatMessageBody
          compact={compact}
          mode='message'
          message={message}
          replyPlainMentionTarget={replyPlainMentionTarget}
          {...rendererArgs}
        />
      </View>
    </View>
  );
}
