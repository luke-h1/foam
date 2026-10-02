import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useSelector } from '@legendapp/state/react';

import { chatStore$ } from '@app/store/chat/observables/chat-store';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flows-inline';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/get-message-structure';
import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { cachedLighten } from '@app/utils/chat/resolve-cached-sender-color/cached-lighten';

import { styles } from '../chat-row.styles';
import type { BadgePressData } from '../chat-row.types';
import { getChatTextStyles } from '../chat-text.styles';
import { ChannelPointsRewardMetaRow } from './channel-points-reward-meta-row';
import { ChatRowMetaHeader } from './chat-row-meta-header';
import { InlineMessageLine } from './inline-message-line';
import { StackedMessageLine } from './stacked-message-line';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import type { ReplyFlags } from './types/reply-flags';

interface UserChatBodyProps {
  badgeList: SanitisedBadgeSet[];
  cachedSenderColor?: string;
  onBadgePress?: (badge: BadgePressData) => void;
  isAction?: boolean;
  isHighlightedMessage?: boolean;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  onUsernamePress?: () => void;
  parentDisplayName?: string;
  replyBody?: string;
  replyFlags: ReplyFlags;
  replyParentMessageId?: string;
  roomId?: string;
  timestamp?: string;
  /**
   * One object from the row. Do not spread it: object rest copies it on
   * every row render.
   */
  tokenRenderProps: ChatTokenRenderProps;
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
  isHighlightedMessage,
  onReplyContextPress,
  onUsernamePress,
  parentDisplayName,
  replyBody,
  replyFlags,
  replyParentMessageId,
  roomId,
  timestamp,
  tokenRenderProps,
  userId,
  userstate,
  userstateColor,
  username,
}: UserChatBodyProps): ReactNode {
  const {
    shouldRenderInlineReply,
    showChannelPointsRewardChrome,
    showTimestamp,
  } = replyFlags;

  const {
    compact,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    fontScale,
    getMentionColor,
    getTokenKey,
    message,
    moderationNotice,
    normalisedCurrentUsername,
    noticeTags,
    onEmoteTouchStart,
    parseTextForEmotes,
  } = tokenRenderProps;

  /**
   * A literal, not object rest, so the React Compiler can cache it. It leaves
   * out `message` (every line names its own) and `moderationNotice`: the
   * stacked line draws one strike over the body, so its tokens and the reply
   * header render unstruck.
   */
  const rendererArgs: Omit<
    ChatTokenRenderProps,
    'message' | 'moderationNotice'
  > = {
    compact,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    fontScale,
    getMentionColor,
    getTokenKey,
    normalisedCurrentUsername,
    noticeTags,
    onEmoteTouchStart,
    parseTextForEmotes,
  };

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
  const rowFlowsInline = flowsInline(message, { hasPaint, isModerated });

  const inlineUsernameColor =
    cachedSenderColor ??
    (userstateColor ? cachedLighten(userstateColor) : undefined) ??
    (username ? cachedLighten(generateRandomTwitchColor(username)) : undefined);

  const actionColor = isAction ? inlineUsernameColor : undefined;
  const textStyles = getChatTextStyles(fontScale, compact);

  /**
   * A painted row's body still flows inline, so it needs the taller emote
   * leading on every nested span - see InlineMessageLine.
   */
  const bodyEmoteLineStyle = getMessageStructure(message).containsEmotes
    ? textStyles.bodyEmoteLine
    : undefined;

  return (
    <View style={styles.messageColumn}>
      <ChatRowMetaHeader
        message={message}
        onReplyContextPress={onReplyContextPress}
        parentDisplayName={parentDisplayName}
        rendererArgs={rendererArgs}
        replyBody={replyBody}
        replyFlags={replyFlags}
        replyParentMessageId={replyParentMessageId}
      />
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
      {rowFlowsInline ? (
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
        <StackedMessageLine
          badgeList={badgeList}
          bodyEmoteLineStyle={bodyEmoteLineStyle}
          cachedSenderColor={cachedSenderColor}
          isModerated={isModerated}
          message={message}
          moderationNotice={moderationNotice}
          onBadgePress={onBadgePress}
          onUsernamePress={onUsernamePress}
          rendererArgs={rendererArgs}
          replyPlainMentionTarget={replyPlainMentionTarget}
          showTimestamp={showTimestamp}
          textColor={actionColor}
          textStyles={textStyles}
          timestamp={timestamp}
          userId={userId}
          username={username}
          userstateColor={userstateColor}
        />
      )}
    </View>
  );
}
