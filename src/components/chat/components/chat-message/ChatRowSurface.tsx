import { type StyleProp, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import type { ChatRowState } from '@app/components/chat/components/chat-message/ChatRow.types';
import { noticeSurfaceTint } from '@app/components/chat/util/chatNoticeAccents';

import { styles } from './ChatRow.styles';
import { getChatTextStyles } from './ChatText.styles';

function getChatRowSurfaceStyle(state: ChatRowState) {
  const {
    announcementAccentColor,
    bodyVariant,
    density,
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
    tokenRenderProps,
  } = state;

  const textStyles = getChatTextStyles(tokenRenderProps.fontScale, density);

  const surface = (colour: StyleProp<ViewStyle>) => [
    textStyles.surface,
    colour,
  ];

  return [
    styles.chatContainer,
    style,
    isAlternatingRow && styles.alternatingRowContainer,
    isAppSystemSender && styles.systemMessageContainer,
    isUserChat &&
      isHighlightedMessageTarget && [
        styles.highlightedReplyTargetContainer,
        textStyles.highlightInset,
      ],
    isUserChat &&
      isHighlightedSender && [
        styles.highlightedSenderContainer,
        textStyles.highlightInset,
      ],
    isUserChat &&
      mentionsCurrentUser && [
        styles.ownMentionContainer,
        textStyles.accentInset,
      ],
    bodyVariant === 'viewer_milestone' &&
      surface(styles.viewerMilestoneContainer),
    bodyVariant === 'mod_anniversary' && surface(styles.modAnniversarySurface),
    bodyVariant === 'subscription' && surface(styles.subscriptionNoticeSurface),
    bodyVariant === 'charity_donation' &&
      surface(styles.charityDonationSurface),
    bodyVariant === 'ritual' && surface(styles.ritualNoticeSurface),
    bodyVariant === 'raid' && surface(styles.raidNoticeSurface),
    bodyVariant === 'announcement' &&
      surface([
        styles.announcementContainer,
        announcementAccentColor
          ? {
              backgroundColor: noticeSurfaceTint(announcementAccentColor),
              borderLeftColor: announcementAccentColor,
            }
          : null,
      ]),
    isUserChat && isFirstMessage && surface(styles.firstMessageNoticeSurface),
    isUserChat &&
      isReturningChatter &&
      surface(styles.returningChatterNoticeSurface),
    isUserChat &&
      !mentionsCurrentUser &&
      customHighlightColor &&
      surface({
        backgroundColor: noticeSurfaceTint(customHighlightColor, 0.1),
        borderLeftColor: customHighlightColor,
      }),
    isUserChat &&
      isHighlightedMessage &&
      surface(styles.highlightMyMessageContainer),
    isChannelPointRedemption &&
      isUserChat &&
      !isHighlightedMessage &&
      surface(styles.rewardMessageContainer),
  ];
}

export function ChatRowSurface({
  state,
  children,
}: {
  state: ChatRowState;
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
