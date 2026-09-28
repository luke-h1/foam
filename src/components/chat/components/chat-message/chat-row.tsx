/**
 * The two halves of a chat row, consumed as a namespace so a call site reads
 * `<ChatRow.Surface>` / `<ChatRow.Body>`.
 */
import { View } from 'react-native';
import type { ReactNode } from 'react';

import type {
  ChatRowBodyState,
  ChatRowSurfaceState,
} from '@app/components/chat/components/chat-message/rich-chat-message.types';

import { noticeSurfaceTint } from '../util/chat-notice-accents';
import { AnnouncementChatBody } from './renderers/announcement-chat-body';
import { ChatNoticeBody } from './renderers/chat-notice-body';
import { SharedChatSourceLabel } from './renderers/shared-chat-source-label';
import { UserChatBody } from './renderers/user-chat-body';
import { styles } from './rich-chat-message.styles';

export function Body(props: ChatRowBodyState) {
  const {
    badges,
    announcementAccentColor,
    bodyVariant,
    cachedSenderColor,
    canJumpToReplyTarget,
    handleBadgePress,
    isAction,
    isChannelPointRedemption,
    isFirstMessage,
    isReturningChatter,
    isReplyingToCurrentUser,
    onReplyContextPress,
    onUsernamePress,
    parentDisplayName,
    partRendererArgs,
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
  } = props;

  const sharedChatLabel = isSharedChatDuplicated ? (
    <SharedChatSourceLabel
      compact={partRendererArgs.compact}
      fontScale={partRendererArgs.fontScale}
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
          userId={userstate['user-id']}
          userstateColor={userstate.color}
          username={userstate.username}
          {...partRendererArgs}
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
          isChannelPointRedemption={isChannelPointRedemption}
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
          userId={userstate['user-id']}
          userstate={userstate}
          userstateColor={userstate.color}
          username={userstate.username}
          {...partRendererArgs}
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
        {...partRendererArgs}
      />
    </>
  );
}

export function Surface({
  state,
  children,
}: {
  state: ChatRowSurfaceState;
  children: ReactNode;
}) {
  const {
    announcementAccentColor,
    bodyVariant,
    clearRowLongPressTimer,
    handleRowTouchMove,
    customHighlightColor,
    isAlternatingRow,
    isAppSystemSender,
    isChannelPointRedemption,
    isFirstMessage,
    isHighlightedMessage,
    isHighlightedMessageTarget,
    isHighlightedSender,
    isReturningChatter,
    isUserChat,
    mentionsCurrentUser,
    startRowLongPressTimer,
    style,
  } = state;

  return (
    <View
      testID='chat-message'
      onTouchCancel={clearRowLongPressTimer}
      onTouchEnd={clearRowLongPressTimer}
      onTouchMove={handleRowTouchMove}
      onTouchStart={startRowLongPressTimer}
      style={[
        styles.chatContainer,
        style,
        isAlternatingRow && styles.alternatingRowContainer,
        isAppSystemSender && styles.systemMessageContainer,
        isUserChat &&
          isHighlightedMessageTarget &&
          styles.highlightedReplyTargetContainer,
        isUserChat && isHighlightedSender && styles.highlightedSenderContainer,
        isUserChat && mentionsCurrentUser && styles.ownMentionContainer,
        bodyVariant === 'viewer_milestone' && styles.viewerMilestoneContainer,
        bodyVariant === 'mod_anniversary' && styles.modAnniversarySurface,
        bodyVariant === 'subscription' && styles.subscriptionNoticeSurface,
        bodyVariant === 'charity_donation' && styles.charityDonationSurface,
        bodyVariant === 'ritual' && styles.ritualNoticeSurface,
        bodyVariant === 'raid' && styles.raidNoticeSurface,
        bodyVariant === 'announcement' && [
          styles.announcementContainer,
          announcementAccentColor
            ? {
                backgroundColor: noticeSurfaceTint(announcementAccentColor),
                borderLeftColor: announcementAccentColor,
              }
            : null,
        ],
        isUserChat && isFirstMessage && styles.firstMessageNoticeSurface,
        isUserChat &&
          isReturningChatter &&
          styles.returningChatterNoticeSurface,
        isUserChat &&
          !mentionsCurrentUser &&
          customHighlightColor && [
            styles.customHighlightContainer,
            {
              backgroundColor: noticeSurfaceTint(customHighlightColor, 0.1),
              borderLeftColor: customHighlightColor,
            },
          ],
        isUserChat &&
          isHighlightedMessage &&
          styles.highlightMyMessageContainer,
        isChannelPointRedemption &&
          isUserChat &&
          !isHighlightedMessage &&
          styles.rewardMessageContainer,
      ]}
    >
      {children}
    </View>
  );
}
