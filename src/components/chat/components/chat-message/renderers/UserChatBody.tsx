import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useUserPaint } from '@app/store/chat/react/user-cosmetics';
import type { BadgePressData } from '@app/store/chat/types/chat-press-data';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { flowsInline } from '@app/utils/chat/derive-chat-body/flowsInline';
import { getMessageStructure } from '@app/utils/chat/derive-chat-body/getMessageStructure';
import { resolveCachedSenderColor } from '@app/utils/chat/resolve-cached-sender-color/resolveCachedSenderColor';

import { styles } from '../ChatRow.styles';
import { getChatTextStyles } from '../ChatText.styles';
import { ChannelPointsRewardMetaRow } from './ChannelPointsRewardMetaRow';
import { ChatRowMetaHeader } from './ChatRowMetaHeader';
import { InlineMessageLine } from './InlineMessageLine';
import { StackedMessageLine } from './StackedMessageLine';
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
    density,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    fontScale,
    getMentionColor,
    isModerated,
    message,
    normalisedCurrentUsername,
    noticeTags,
    onEmoteTouchStart,
    parseTextForEmotes,
  } = tokenRenderProps;

  /**
   * A literal, not object rest, so the React Compiler can cache it. It leaves
   * out `message`: every line names its own.
   */
  const rendererArgs: Omit<ChatTokenRenderProps, 'message'> = {
    density,
    disableEmoteAnimations,
    effectiveHighlightedUserSet,
    fontScale,
    getMentionColor,
    isModerated,
    normalisedCurrentUsername,
    noticeTags,
    onEmoteTouchStart,
    parseTextForEmotes,
  };

  const replyPlainMentionTarget = shouldRenderInlineReply
    ? normaliseChatUsername(parentDisplayName)
    : undefined;

  const hasPaint = useUserPaint(userId) !== null;

  /**
   * A paint renders through a mask, so a painted row cannot put the username
   * in the same Text as the body - but the body alone still flows.
   */
  const rowFlowsInline = flowsInline(message, { hasPaint, isModerated });

  const inlineUsernameColor = resolveCachedSenderColor({
    cachedSenderColor,
    sender: username ?? '',
    userstate: { color: userstateColor },
  });

  const actionColor = isAction ? inlineUsernameColor : undefined;
  const textStyles = getChatTextStyles(fontScale, density);

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
        {...{
          message,
          onReplyContextPress,
          parentDisplayName,
          rendererArgs,
          replyBody,
          replyFlags,
          replyParentMessageId,
        }}
      />
      {showChannelPointsRewardChrome && userstate ? (
        <ChannelPointsRewardMetaRow
          {...{
            density,
            fontScale,
            isHighlightedMessage,
            isModerated,
            noticeTags: rendererArgs.noticeTags,
            roomId,
            username,
            userstate,
          }}
        />
      ) : null}
      {rowFlowsInline ? (
        <InlineMessageLine
          {...rendererArgs}
          {...{
            badgeList,
            isAction,
            message,
            onBadgePress,
            onUsernamePress,
            replyPlainMentionTarget,
            showTimestamp,
            timestamp,
            textColor: actionColor,
            username,
            usernameColor: inlineUsernameColor,
          }}
        />
      ) : (
        <StackedMessageLine
          {...{
            badgeList,
            bodyEmoteLineStyle,
            cachedSenderColor,
            message,
            onBadgePress,
            onUsernamePress,
            rendererArgs,
            replyPlainMentionTarget,
            showTimestamp,
            textColor: actionColor,
            textStyles,
            timestamp,
            userId,
            username,
            userstateColor,
          }}
        />
      )}
    </View>
  );
}
