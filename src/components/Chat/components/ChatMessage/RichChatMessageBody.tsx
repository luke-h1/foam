import { useColorScheme, View } from 'react-native';
import type { ReactNode } from 'react';

import { noticeSurfaceTint } from '../util/chatNoticeAccents';
import { AnnouncementChatBody } from './renderers/AnnouncementChatBody';
import { ChatNoticeBody } from './renderers/ChatNoticeBody';
import { SharedChatSourceLabel } from './renderers/SharedChatSourceLabel';
import { UserChatBody } from './renderers/UserChatBody';
import { getRichChatMessageStyles } from './RichChatMessage.styles';
import type { useRichChatMessage } from './useRichChatMessage';

type RichChatMessageState = ReturnType<typeof useRichChatMessage>;

export function RichChatMessageBody(props: RichChatMessageState) {
  const {
    badges,
    announcementAccentColor,
    bodyVariant,
    cachedSenderColor,
    canJumpToReplyTarget,
    getMappingKey,
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
    <SharedChatSourceLabel />
  ) : null;

  if (bodyVariant === 'announcement') {
    return (
      <>
        {sharedChatLabel}
        <AnnouncementChatBody
          accentColor={announcementAccentColor}
          badgeList={badges}
          cachedSenderColor={cachedSenderColor}
          getMappingKey={(id, index) => String(getMappingKey(id, index))}
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
          getMappingKey={(id, index) => String(getMappingKey(id, index))}
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

export function RichChatMessageContainer({
  state,
  children,
}: {
  state: RichChatMessageState;
  children: ReactNode;
}) {
  const {
    announcementAccentColor,
    bodyVariant,
    clearRowLongPressTimer,
    compact,
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const styles = getRichChatMessageStyles(scheme);

  return (
    <View
      testID='chat-message'
      onTouchCancel={clearRowLongPressTimer}
      onTouchEnd={clearRowLongPressTimer}
      onTouchMove={clearRowLongPressTimer}
      onTouchStart={startRowLongPressTimer}
      style={[
        styles.chatContainer,
        compact && styles.chatContainerCompact,
        style,
        isAlternatingRow && styles.alternatingRowContainer,
        isAppSystemSender && styles.systemMessageContainer,
        isUserChat &&
          isHighlightedMessageTarget &&
          styles.highlightedReplyTargetContainer,
        isUserChat && isHighlightedSender && styles.highlightedSenderContainer,
        isUserChat && mentionsCurrentUser && styles.ownMentionContainer,
        bodyVariant === 'viewer_milestone' && styles.viewerMilestoneContainer,
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
