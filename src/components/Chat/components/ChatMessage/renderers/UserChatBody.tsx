import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { lightenColor } from '@app/utils/color/lightenColor';
import { useSelector } from '@legendapp/state/react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { CHAT_NOTICE_ACCENTS } from '../../util/chatNoticeAccents';
import { styles } from '../RichChatMessage.styles';
import { normaliseUsername } from '../richChatMessageHelpers';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import { RichChatMessageUsername } from '../RichChatMessageUsername';
import { ChatMessageBadges } from './ChatMessageBadges';
import { ChatMessageBody } from './ChatMessageBody';
import { canRenderMessageInline, InlineMessageLine } from './InlineMessageLine';
import { ReplyingToHeader } from './ReplyingToHeader';
import type { BadgePressData } from '../RichChatMessage.types';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';

import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';

interface UserChatBodyProps extends UseChatMessagePartRendererArgs {
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string;
  getMappingKey: (id: string, index: number) => string;
  onBadgePress?: (badge: BadgePressData) => void;
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
    isReturningChatter?: boolean;
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
  onBadgePress,
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
    isReturningChatter,
    isReplyingToCurrentUser,
    shouldRenderInlineReply,
    showChannelPointsRewardChrome,
    showTimestamp,
  } = replyFlags;
  const replyPlainMentionTarget = shouldRenderInlineReply
    ? normaliseUsername(parentDisplayName)
    : undefined;
  const hasPaint = useSelector(() =>
    userId ? Boolean(chatStore$.userPaintIds[userId]?.get()) : false,
  );
  const renderInline = canRenderMessageInline(message, {
    hasPaint,
    isModerated: Boolean(moderationNotice),
  });
  const inlineUsernameColor =
    cachedSenderColor ??
    (userstateColor ? lightenColor(userstateColor) : undefined) ??
    (username ? lightenColor(generateRandomTwitchColor(username)) : undefined);

  return (
    <View style={styles.messageColumn}>
      {shouldRenderInlineReply && parentDisplayName ? (
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
      ) : isFirstMessage ? (
        <ChatNoticeMetaRow
          compact={compact}
          icon='sparkles'
          label='First message'
          labelColor={CHAT_NOTICE_ACCENTS.firstMessage}
          labelStyle={styles.firstMessageMetaText}
        />
      ) : isReturningChatter ? (
        <ChatNoticeMetaRow
          compact={compact}
          icon='arrow.uturn.left'
          label='Returning chatter'
          labelColor={CHAT_NOTICE_ACCENTS.returningChatter}
          labelStyle={styles.returningChatterMetaText}
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
      ) : showChannelPointsRewardChrome ? (
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
      {renderInline ? (
        <InlineMessageLine
          {...rendererArgs}
          badgeList={badgeList}
          compact={compact}
          getMappingKey={getMappingKey}
          message={
            message as Parameters<typeof InlineMessageLine>[0]['message']
          }
          onBadgePress={onBadgePress}
          onUsernamePress={onUsernamePress}
          replyPlainMentionTarget={replyPlainMentionTarget}
          showTimestamp={showTimestamp}
          timestamp={timestamp}
          username={username}
          usernameColor={inlineUsernameColor}
        />
      ) : (
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
            onBadgePress={onBadgePress}
          />
          {username ? (
            <View
              style={
                moderationNotice ? styles.moderatedUsernameContainer : null
              }
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
      )}
    </View>
  );
}
