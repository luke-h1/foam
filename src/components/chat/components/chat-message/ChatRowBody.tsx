import type { ChatRowBodyState } from '@app/components/chat/components/chat-message/ChatRow.types';

import { AnnouncementChatBody } from './renderers/AnnouncementChatBody';
import { ChatNoticeBody } from './renderers/ChatNoticeBody';
import { SharedChatSourceLabel } from './renderers/SharedChatSourceLabel';
import { UserChatBody } from './renderers/UserChatBody';

/**
 * Picks the body renderer for a row from its variant: an announcement, an
 * ordinary user message, or one of the notice kinds.
 *
 * Takes the row state as one prop, so a row render does not copy its fields.
 */
export function ChatRowBody({ state }: { state: ChatRowBodyState }) {
  const {
    badges,
    announcementAccentColor,
    bodyVariant,
    cachedSenderColor,
    canJumpToReplyTarget,
    handleBadgePress,
    isAction,
    isFirstMessage,
    isReturningChatter,
    isReplyingToCurrentUser,
    onReplyContextPress,
    onUsernamePress,
    parentDisplayName,
    tokenRenderProps,
    replyBody,
    replyParentMessageId,
    roomId,
    shouldRenderInlineReply,
    showChannelPointsRewardChrome,
    showTimestamp,
    timestamp,
    userstate,
    isSharedChatDuplicated,
    isHighlightedMessage,
  } = state;

  const sharedChatLabel = isSharedChatDuplicated ? (
    <SharedChatSourceLabel
      compact={tokenRenderProps.compact}
      fontScale={tokenRenderProps.fontScale}
    />
  ) : null;

  if (bodyVariant === 'announcement') {
    return (
      <>
        {sharedChatLabel}
        <AnnouncementChatBody
          {...{
            accentColor: announcementAccentColor,
            badgeList: badges,
            cachedSenderColor,
            onBadgePress: handleBadgePress,
            onUsernamePress,
            showTimestamp,
            timestamp,
            tokenRenderProps,
            userId: userstate['user-id'],
            userstateColor: userstate.color,
            username: userstate.username,
          }}
        />
      </>
    );
  }

  if (bodyVariant === 'user_chat') {
    return (
      <>
        {sharedChatLabel}
        <UserChatBody
          replyFlags={{
            canJumpToReplyTarget,
            isFirstMessage,
            isReturningChatter,
            isReplyingToCurrentUser,
            shouldRenderInlineReply,
            showChannelPointsRewardChrome,
            showTimestamp,
          }}
          {...{
            badgeList: badges,
            onBadgePress: handleBadgePress,
            cachedSenderColor,
            isAction,
            isHighlightedMessage,
            onReplyContextPress,
            onUsernamePress,
            parentDisplayName,
            replyBody,
            replyParentMessageId,
            roomId,
            timestamp,
            tokenRenderProps,
            userId: userstate['user-id'],
            userstate,
            userstateColor: userstate.color,
            username: userstate.username,
          }}
        />
      </>
    );
  }

  return (
    <>
      {sharedChatLabel}
      <ChatNoticeBody
        {...tokenRenderProps}
        {...{ bodyVariant, showTimestamp, timestamp }}
      />
    </>
  );
}
