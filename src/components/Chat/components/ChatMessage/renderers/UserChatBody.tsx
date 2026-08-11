import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useSelector } from '@legendapp/state/react';

import { CHAT_NOTICE_ACCENTS } from '@app/components/Chat/components/util/chatNoticeAccents';
import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';
import { canFlowInline } from '@app/utils/chat/deriveChatBody/canFlowInline';
import { getMessageStructure } from '@app/utils/chat/deriveChatBody/getMessageStructure';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { cachedLighten } from '@app/utils/chat/resolveCachedSenderColor/cachedLighten';

import { getChatTextStyles } from '../chatText.styles';
import { styles } from '../RichChatMessage.styles';
import type { BadgePressData } from '../RichChatMessage.types';
import { RichChatMessageUsername } from '../RichChatMessageUsername';
import { ChannelPointsRewardMetaRow } from './ChannelPointsRewardMetaRow';
import { ChatMessageBadges } from './ChatMessageBadges';
import { ChatMessageBody } from './ChatMessageBody';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import { InlineMessageLine } from './InlineMessageLine';
import { InlineMessageSpans } from './InlineMessageSpans';
import { ReplyingToHeader } from './ReplyingToHeader';
import type { ChatMessagePartRendererArgs } from './types/ChatMessagePartRendererArgs';

interface UserChatBodyProps extends ChatMessagePartRendererArgs {
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string;
  onBadgePress?: (badge: BadgePressData) => void;
  isAction?: boolean;
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
  roomId?: string;
  timestamp?: string;
  userId?: string;
  userstate?: UserStateTags;
  userstateColor?: string;
  username?: string;
}

export function UserChatBody({
  badgeList,
  onBadgePress,
  cachedSenderColor,
  isAction,
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
  roomId,
  timestamp,
  userId,
  userstate,
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
  const { compact, fontScale } = rendererArgs;
  const replyPlainMentionTarget = shouldRenderInlineReply
    ? normaliseChatUsername(parentDisplayName)
    : undefined;
  const hasPaint = useSelector(() => {
    if (!userId) {
      return false;
    }
    const paintId = chatStore$.userPaintIds[userId]?.get();
    return Boolean(paintId && chatStore$.paints[paintId]?.get());
  });
  const isModerated = Boolean(moderationNotice);
  /**
   * A paint renders through a mask, so a painted row cannot put the username
   * in the same Text as the body - but the body alone still flows.
   */
  const renderInline = canFlowInline(message, { hasPaint, isModerated });
  const bodyFlowsInline =
    !renderInline && canFlowInline(message, { hasPaint: false, isModerated });
  const inlineUsernameColor =
    cachedSenderColor ??
    (userstateColor ? cachedLighten(userstateColor) : undefined) ??
    (username ? cachedLighten(generateRandomTwitchColor(username)) : undefined);
  const actionColor = isAction ? inlineUsernameColor : undefined;
  const textStyles = getChatTextStyles(fontScale, compact);
  /**
   * A painted row keeps the username out of the body Text but still flows the
   * body inline, so the body carries emotes on its own and needs the taller
   * emote leading on every nested span - see InlineMessageLine.
   */
  const bodyEmoteLineStyle = getMessageStructure(message).containsEmotes
    ? textStyles.bodyEmoteLine
    : undefined;

  return (
    <View style={styles.messageColumn}>
      {shouldRenderInlineReply && parentDisplayName ? (
        <ReplyingToHeader
          canJumpToReplyTarget={canJumpToReplyTarget}
          isReplyingToCurrentUser={isReplyingToCurrentUser}
          onReplyContextPress={onReplyContextPress}
          parentDisplayName={parentDisplayName}
          replyBody={replyBody}
          replyParentMessageId={replyParentMessageId}
          rendererArgs={{ ...rendererArgs, message }}
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
      {showChannelPointsRewardChrome && userstate ? (
        <ChannelPointsRewardMetaRow
          compact={compact}
          fontScale={fontScale}
          isHighlightedMessage={isHighlightedMessage}
          moderationNotice={moderationNotice}
          noticeTags={rendererArgs.noticeTags}
          roomId={roomId}
          username={username}
          userstate={userstate}
        />
      ) : null}
      {renderInline ? (
        <InlineMessageLine
          {...rendererArgs}
          badgeList={badgeList}
          isAction={isAction}
          message={message}
          onBadgePress={onBadgePress}
          onUsernamePress={onUsernamePress}
          replyPlainMentionTarget={replyPlainMentionTarget}
          showTimestamp={showTimestamp}
          timestamp={timestamp}
          textColor={actionColor}
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
            <Text tabular style={textStyles.timestamp}>
              {timestamp}
            </Text>
          ) : null}
          <ChatMessageBadges
            badges={badgeList}
            compact={compact}
            fontScale={fontScale}
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
                fontScale={fontScale}
                isModerated={Boolean(moderationNotice)}
                onUsernamePress={onUsernamePress}
                userId={userId}
                userstateColor={userstateColor}
                username={username}
              />
            </View>
          ) : null}
          {bodyFlowsInline ? (
            <Text style={[textStyles.body, bodyEmoteLineStyle]}>
              <InlineMessageSpans
                {...rendererArgs}
                emoteLineStyle={bodyEmoteLineStyle}
                message={message}
                replyPlainMentionTarget={replyPlainMentionTarget}
                textColor={actionColor}
              />
            </Text>
          ) : (
            <ChatMessageBody
              mode='message'
              message={message}
              replyPlainMentionTarget={replyPlainMentionTarget}
              textColor={actionColor}
              {...rendererArgs}
            />
          )}
        </View>
      )}
    </View>
  );
}
