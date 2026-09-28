import { View } from 'react-native';
import type { ReactNode } from 'react';

import type { ChatRowSurfaceState } from '@app/components/chat/components/chat-message/chat-row.types';

import { noticeSurfaceTint } from '../util/chat-notice-accents';
import { styles } from './chat-row.styles';

/**
 * A chat row's background is the sum of what the message is: whose turn in the
 * alternating stripe, which notice kind, and whether it mentions you, matches
 * a custom highlight, or is your own highlighted message.
 */
function getChatRowSurfaceStyle(state: ChatRowSurfaceState) {
  const {
    announcementAccentColor,
    bodyVariant,
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
    style,
  } = state;

  return [
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
    isUserChat && isReturningChatter && styles.returningChatterNoticeSurface,
    isUserChat &&
      !mentionsCurrentUser &&
      customHighlightColor && [
        styles.customHighlightContainer,
        {
          backgroundColor: noticeSurfaceTint(customHighlightColor, 0.1),
          borderLeftColor: customHighlightColor,
        },
      ],
    isUserChat && isHighlightedMessage && styles.highlightMyMessageContainer,
    isChannelPointRedemption &&
      isUserChat &&
      !isHighlightedMessage &&
      styles.rewardMessageContainer,
  ];
}

/**
 * The row's background and its long-press touch target.
 */
export function ChatRowSurface({
  state,
  children,
}: {
  state: ChatRowSurfaceState;
  children: ReactNode;
}) {
  const { clearRowLongPressTimer, handleRowTouchMove, startRowLongPressTimer } =
    state;

  return (
    <View
      testID='chat-message'
      onTouchCancel={clearRowLongPressTimer}
      onTouchEnd={clearRowLongPressTimer}
      onTouchMove={handleRowTouchMove}
      onTouchStart={startRowLongPressTimer}
      style={getChatRowSurfaceStyle(state)}
    >
      {children}
    </View>
  );
}
