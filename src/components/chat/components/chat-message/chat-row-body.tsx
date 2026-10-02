import type { ChatRowBodyState } from '@app/components/chat/components/chat-message/chat-row.types';

import { AnnouncementChatBody } from './renderers/announcement-chat-body';
import { ChatNoticeBody } from './renderers/chat-notice-body';
import { SharedChatSourceLabel } from './renderers/shared-chat-source-label';
import { UserChatBody } from './renderers/user-chat-body';

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
          accentColor={announcementAccentColor}
          badgeList={badges}
          cachedSenderColor={cachedSenderColor}
          onBadgePress={handleBadgePress}
          onUsernamePress={onUsernamePress}
          showTimestamp={showTimestamp}
          timestamp={timestamp}
          tokenRenderProps={tokenRenderProps}
          userId={userstate['user-id']}
          userstateColor={userstate.color}
          username={userstate.username}
        />
      </>
    );
  }

  if (bodyVariant === 'user_chat') {
    return (
      <>
        {sharedChatLabel}
        <UserChatBody
          badgeList={badges}
          onBadgePress={handleBadgePress}
          cachedSenderColor={cachedSenderColor}
          isAction={isAction}
          isHighlightedMessage={isHighlightedMessage}
          onReplyContextPress={onReplyContextPress}
          onUsernamePress={onUsernamePress}
          parentDisplayName={parentDisplayName}
          replyBody={replyBody}
          replyFlags={{
            canJumpToReplyTarget,
            isFirstMessage,
            isReturningChatter,
            isReplyingToCurrentUser,
            shouldRenderInlineReply,
            showChannelPointsRewardChrome,
            showTimestamp,
          }}
          replyParentMessageId={replyParentMessageId}
          roomId={roomId}
          timestamp={timestamp}
          tokenRenderProps={tokenRenderProps}
          userId={userstate['user-id']}
          userstate={userstate}
          userstateColor={userstate.color}
          username={userstate.username}
        />
      </>
    );
  }

  return (
    <>
      {sharedChatLabel}
      <ChatNoticeBody
        bodyVariant={bodyVariant}
        showTimestamp={showTimestamp}
        timestamp={timestamp}
        {...tokenRenderProps}
      />
    </>
  );
}
