/* eslint-disable camelcase */
import { useChannelPointRewardTitle } from '@app/hooks/useChannelPointRewardTitle';
import type { ChatMessageType } from '@app/store/chatStore/constants';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import {
  type UserNoticeTags,
  UserNoticeVariantMap,
} from '@app/types/chat/irc-tags/usernotice';
import { channelPointsRewardTitleFromUserstate } from '@app/utils/chat/channelPointsRewardTitle';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { lightenColor } from '@app/utils/color/lightenColor';
import { useMappingHelper } from '@shopify/flash-list';
import React, { useCallback, memo, useMemo, type ReactNode } from 'react';
import { Button } from '../../../Button/Button';
import { PaintedUsername } from './CosmeticUsername/CosmeticUsername';
import { ChatMessageBadges } from './renderers/ChatMessageBadges';
import { SpecialChatBody } from './renderers/SpecialChatBody';
import { UserChatBody } from './renderers/UserChatBody';
import { useChatMessagePartRenderer } from './renderers/useChatMessagePartRenderer';
import { styles } from './RichChatMessage.styles';
import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  RichChatMessageProps,
  UsernamePressData,
} from './RichChatMessage.types';
import {
  getChatBodyInfo,
  getPartIdentity,
  normaliseUsername,
} from './richChatMessageUtils';

export type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from './RichChatMessage.types';

type ChatMessageComponentProps = Parameters<
  typeof ChatMessageComponent<NoticeVariants>
>[0];

function hasHighlightedUserMembershipChange(
  previous: Readonly<ChatMessageComponentProps>,
  next: Readonly<ChatMessageComponentProps>,
): boolean {
  if (
    previous.highlightedUserSet === next.highlightedUserSet &&
    previous.highlightedUsers === next.highlightedUsers
  ) {
    return false;
  }

  const previousHighlightedUsers = previous.highlightedUsers;
  const nextHighlightedUsers = next.highlightedUsers;
  const previousHasUsername = (username: string) =>
    Boolean(previous.highlightedUserSet?.has(username)) ||
    Boolean(
      previousHighlightedUsers?.some(
        highlightedUser => normaliseUsername(highlightedUser) === username,
      ),
    );
  const nextHasUsername = (username: string) =>
    Boolean(next.highlightedUserSet?.has(username)) ||
    Boolean(
      nextHighlightedUsers?.some(
        highlightedUser => normaliseUsername(highlightedUser) === username,
      ),
    );
  const usernameKeys = new Set<string>();
  const senderKey = normaliseUsername(
    next.userstate.username || next.userstate.login || next.sender,
  );

  if (senderKey) {
    usernameKeys.add(senderKey);
  }

  for (const part of next.message) {
    if (part.type === 'mention') {
      const mentionKey = normaliseUsername(part.content);
      if (mentionKey) {
        usernameKeys.add(mentionKey);
      }
    }
  }

  for (const usernameKey of usernameKeys) {
    if (previousHasUsername(usernameKey) !== nextHasUsername(usernameKey)) {
      return true;
    }
  }

  return false;
}

function areChatMessagePropsEqual(
  previous: Readonly<ChatMessageComponentProps>,
  next: Readonly<ChatMessageComponentProps>,
): boolean {
  return (
    previous.id === next.id &&
    previous.userstate === next.userstate &&
    previous.message === next.message &&
    previous.badges === next.badges &&
    previous.channel === next.channel &&
    previous.message_id === next.message_id &&
    previous.message_nonce === next.message_nonce &&
    previous.timestamp === next.timestamp &&
    previous.sender === next.sender &&
    previous.style === next.style &&
    previous.cachedSenderColor === next.cachedSenderColor &&
    previous.parentDisplayName === next.parentDisplayName &&
    previous.replyBody === next.replyBody &&
    previous.replyDisplayName === next.replyDisplayName &&
    previous.notice_tags === next.notice_tags &&
    previous.isChannelPointRedemption === next.isChannelPointRedemption &&
    previous.isTwitchSystemNotice === next.isTwitchSystemNotice &&
    previous.onReply === next.onReply &&
    previous.onBadgePress === next.onBadgePress &&
    previous.onMessageLongPress === next.onMessageLongPress &&
    previous.onEmotePress === next.onEmotePress &&
    previous.getMentionColor === next.getMentionColor &&
    previous.parseTextForEmotes === next.parseTextForEmotes &&
    previous.onUsernamePress === next.onUsernamePress &&
    previous.currentUsername === next.currentUsername &&
    previous.currentUsernameNormalized === next.currentUsernameNormalized &&
    previous.density === next.density &&
    previous.disableEmoteAnimations === next.disableEmoteAnimations &&
    previous.showTimestamp === next.showTimestamp &&
    previous.showInlineReplyContext === next.showInlineReplyContext &&
    previous.moderationNotice === next.moderationNotice &&
    previous.onReplyContextPress === next.onReplyContextPress &&
    previous.isHighlightedMessageTarget === next.isHighlightedMessageTarget &&
    !hasHighlightedUserMembershipChange(previous, next)
  );
}

function ChatMessageComponent<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
>({
  id,
  userstate,
  message,
  badges,
  channel,
  message_id,
  message_nonce,
  timestamp,
  sender,
  style,
  cachedSenderColor,
  parentDisplayName,
  replyBody,
  replyDisplayName,
  parentColor: _,
  notice_tags,
  onReply,
  onBadgePress,
  onMessageLongPress,
  onEmotePress,
  getMentionColor,
  parseTextForEmotes,
  isChannelPointRedemption,
  isTwitchSystemNotice,
  onUsernamePress,
  currentUsername,
  currentUsernameNormalized,
  density = 'comfortable',
  disableEmoteAnimations = false,
  showTimestamp = true,
  highlightedUserSet,
  highlightedUsers,
  showInlineReplyContext = true,
  moderationNotice,
  onReplyContextPress,
  isHighlightedMessageTarget = false,
}: RichChatMessageProps<TNoticeType, TVariant>) {
  const { getMappingKey } = useMappingHelper();
  const compact = density === 'compact';
  const normalisedCurrentUsername =
    currentUsernameNormalized ?? normaliseUsername(currentUsername);
  const fallbackHighlightedUserSet = useMemo(() => {
    if (!highlightedUsers?.length) {
      return undefined;
    }

    return new Set(highlightedUsers.map(normaliseUsername));
  }, [highlightedUsers]);
  const effectiveHighlightedUserSet =
    highlightedUserSet ?? fallbackHighlightedUserSet;
  const messageSenderKey = normaliseUsername(
    userstate.username || userstate.login || sender,
  );
  const isHighlightedSender =
    messageSenderKey.length > 0 &&
    effectiveHighlightedUserSet?.has(messageSenderKey);
  const getPartKey = useCallback(
    (part: ParsedPart, index: number) =>
      getMappingKey(getPartIdentity(part, index), index),
    [getMappingKey],
  );

  const handleEmotePress = useCallback(
    (part: EmotePressData) => {
      onEmotePress?.(part);
    },
    [onEmotePress],
  );

  const handleBadgePress = useCallback(
    (badge: BadgePressData) => {
      onBadgePress?.(badge);
    },
    [onBadgePress],
  );

  const handleUsernamePress = useCallback(() => {
    if (!userstate.username) {
      return;
    }

    onUsernamePress?.({
      username: userstate.username,
      login: userstate.login,
      userId: userstate['user-id'],
      color: userstate.color,
    });
  }, [onUsernamePress, userstate]);

  const usernameElement = useMemo(() => {
    if (!userstate.username || isChannelPointRedemption) {
      return null;
    }

    const username = (
      <PaintedUsername
        username={userstate.username}
        userId={userstate['user-id']}
        fallbackColor={
          cachedSenderColor ??
          (userstate.color ? lightenColor(userstate.color) : undefined)
        }
        usernameTextStyle={compact ? styles.usernameCompact : undefined}
      />
    );

    if (!onUsernamePress) {
      return username;
    }

    return (
      <Button
        onPress={handleUsernamePress}
        style={styles.usernameButton}
        testID='chat-username-button'
      >
        {username}
      </Button>
    );
  }, [
    compact,
    cachedSenderColor,
    handleUsernamePress,
    isChannelPointRedemption,
    onUsernamePress,
    userstate,
  ]);

  const { renderMessagePart, renderSystemMessagePart } =
    useChatMessagePartRenderer({
      compact,
      disableEmoteAnimations,
      effectiveHighlightedUserSet,
      getMentionColor,
      getPartKey,
      handleEmotePress,
      message,
      moderationNotice,
      normalisedCurrentUsername,
      noticeTags: notice_tags as UserNoticeTags | undefined,
      parseTextForEmotes,
    });

  const renderBadges = useCallback(
    () => (
      <ChatMessageBadges
        badges={badges}
        compact={compact}
        getMappingKey={getMappingKey}
        moderationNotice={moderationNotice}
        onBadgePress={handleBadgePress}
      />
    ),
    [badges, compact, getMappingKey, handleBadgePress, moderationNotice],
  );

  const {
    hasSubscriptionNotice,
    mentionsCurrentUser,
    variant: bodyVariant,
  } = getChatBodyInfo(
    message,
    normalisedCurrentUsername,
    sender,
    isTwitchSystemNotice,
  );

  const isAppSystemSender = bodyVariant === 'app_system_sender';
  const isUserChat = bodyVariant === 'user_chat';
  const showChannelPointsRewardChrome = Boolean(
    isUserChat && isChannelPointRedemption && userstate.username,
  );

  const rewardTitleIrc = showChannelPointsRewardChrome
    ? channelPointsRewardTitleFromUserstate(userstate)
    : undefined;
  const roomId =
    typeof userstate['room-id'] === 'string' ? userstate['room-id'] : undefined;
  const rewardId =
    typeof userstate['custom-reward-id'] === 'string'
      ? userstate['custom-reward-id']
      : undefined;
  const rewardTitleApi = useChannelPointRewardTitle(
    roomId,
    rewardId,
    Boolean(
      showChannelPointsRewardChrome && !rewardTitleIrc && roomId && rewardId,
    ),
  );
  const rewardSummaryTitle =
    rewardTitleIrc ?? rewardTitleApi ?? 'Channel Points reward';

  const canReply =
    onReply &&
    !moderationNotice &&
    !hasSubscriptionNotice &&
    bodyVariant !== 'stv_emote_event' &&
    bodyVariant !== 'viewer_milestone' &&
    userstate.username &&
    sender?.toLowerCase() !== 'system';

  const handleLongPress = useCallback(() => {
    const messageData = {
      id,
      userstate,
      message,
      badges,
      channel,
      message_id,
      message_nonce,
      sender,
      moderationNotice,
      parentDisplayName,
      replyBody,
      replyDisplayName,
    } as ChatMessageType<TNoticeType>;

    if (canReply) {
      onReply?.(messageData);
    }
    onMessageLongPress?.({
      message,
      username: userstate.username,
      login: userstate.login,
      userId: userstate['user-id'],
      messageData,
    });
  }, [
    onReply,
    canReply,
    onMessageLongPress,
    message,
    userstate,
    id,
    badges,
    channel,
    message_id,
    message_nonce,
    sender,
    moderationNotice,
    parentDisplayName,
    replyBody,
    replyDisplayName,
  ]);

  const isReply = Boolean(parentDisplayName);
  const replyParentMessageId = userstate['reply-parent-msg-id'];
  const isFirstMessage = userstate['first-msg'] === '1';
  const shouldRenderInlineReply =
    showInlineReplyContext &&
    isReply &&
    Boolean(replyBody || parentDisplayName);
  const canJumpToReplyTarget =
    Boolean(onReplyContextPress) && Boolean(replyParentMessageId);

  const renderChatBody = (): ReactNode => {
    if (bodyVariant === 'user_chat') {
      return (
        <UserChatBody
          canJumpToReplyTarget={canJumpToReplyTarget}
          compact={compact}
          isFirstMessage={isFirstMessage}
          message={message}
          moderationNotice={moderationNotice}
          onReplyContextPress={onReplyContextPress}
          parentDisplayName={parentDisplayName}
          renderBadges={renderBadges}
          renderMessagePart={renderMessagePart}
          replyBody={replyBody}
          replyParentMessageId={replyParentMessageId}
          rewardSummaryTitle={rewardSummaryTitle}
          shouldRenderInlineReply={shouldRenderInlineReply}
          showChannelPointsRewardChrome={showChannelPointsRewardChrome}
          showTimestamp={showTimestamp}
          timestamp={timestamp}
          username={userstate.username}
          usernameElement={usernameElement}
        />
      );
    }

    return (
      <SpecialChatBody
        bodyVariant={bodyVariant}
        compact={compact}
        message={message}
        renderMessagePart={renderMessagePart}
        renderSystemMessagePart={renderSystemMessagePart}
        showTimestamp={showTimestamp}
        timestamp={timestamp}
      />
    );
  };

  return (
    <Button
      testID='chat-message'
      onLongPress={handleLongPress}
      style={[
        styles.chatContainer,
        compact && styles.chatContainerCompact,
        style,
        isAppSystemSender && styles.systemMessageContainer,
        isUserChat &&
          isHighlightedMessageTarget &&
          styles.highlightedReplyTargetContainer,
        isUserChat && isHighlightedSender && styles.highlightedSenderContainer,
        isUserChat && isReply && styles.replyContainer,
        isUserChat && mentionsCurrentUser && styles.ownMentionContainer,
        bodyVariant === 'viewer_milestone' && styles.viewerMilestoneContainer,
        isChannelPointRedemption && isUserChat && styles.rewardMessageContainer,
      ]}
    >
      {renderChatBody()}
    </Button>
  );
}

const MemoizedRichChatMessage = memo(
  ChatMessageComponent,
  areChatMessagePropsEqual,
);
MemoizedRichChatMessage.displayName = 'RichChatMessage';

export const RichChatMessage = MemoizedRichChatMessage as unknown as <
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
>(
  props: ChatMessageType<TNoticeType, TVariant> & {
    onReply?: (args: ChatMessageType<TNoticeType>) => void;
    onBadgePress?: (data: BadgePressData) => void;
    onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
    onEmotePress?: (data: EmotePressData) => void;
    getMentionColor?: (username: string) => string;
    parseTextForEmotes?: (text: string) => ParsedPart[];
    onUsernamePress?: (data: UsernamePressData) => void;
    currentUsername?: string;
    currentUsernameNormalized?: string;
    density?: 'comfortable' | 'compact';
    disableEmoteAnimations?: boolean;
    showTimestamp?: boolean;
    highlightedUsers?: string[];
    highlightedUserSet?: ReadonlySet<string>;
    showInlineReplyContext?: boolean;
    onReplyContextPress?: (replyParentMessageId: string) => void;
    isHighlightedMessageTarget?: boolean;
  },
) => React.JSX.Element;
