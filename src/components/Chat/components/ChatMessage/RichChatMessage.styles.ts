import { StyleSheet } from 'react-native';

import { type ColorScheme, theme } from '@app/styles/themes';

import {
  CHAT_NOTICE_ACCENTS,
  noticeSurfaceTint,
} from '../util/chatNoticeAccents';

export const chatLineMetrics = {
  comfortable: {
    fontSize: theme.fontSize14,
    lineHeight: 17,
  },
  compact: {
    fontSize: theme.fontSize11,
    lineHeight: 14,
  },
} as const;

const chatFontScaleLineMetrics = {
  small: {
    comfortable: { fontSize: theme.fontSize12, lineHeight: 15 },
    compact: { fontSize: theme.fontSize10, lineHeight: 13 },
  },
  large: {
    comfortable: { fontSize: theme.fontSize16, lineHeight: 20 },
    compact: { fontSize: theme.fontSize12, lineHeight: 15 },
  },
} as const;

export type ChatFontScale = 'small' | 'default' | 'large';

export interface ChatLineMetrics {
  fontSize: number;
  lineHeight: number;
}

/**
 * The fontSize/lineHeight a message body line renders at, after the chat
 * font-scale preference is applied. Height estimation
 * (util/pretextChatHeight.ts) must measure with these exact metrics.
 */
export function getChatLineMetrics(
  fontScale: ChatFontScale | undefined,
  compact: boolean,
): ChatLineMetrics {
  const density = compact ? 'compact' : 'comfortable';
  if (fontScale === 'small' || fontScale === 'large') {
    return chatFontScaleLineMetrics[fontScale][density];
  }
  return chatLineMetrics[density];
}

const fontScaleStyles = StyleSheet.create({
  fontScaleLarge: {
    ...chatFontScaleLineMetrics.large.comfortable,
  },
  fontScaleLargeCompact: {
    ...chatFontScaleLineMetrics.large.compact,
  },
  fontScaleSmall: {
    ...chatFontScaleLineMetrics.small.comfortable,
  },
  fontScaleSmallCompact: {
    ...chatFontScaleLineMetrics.small.compact,
  },
});

export function getChatFontScaleStyle(
  fontScale: ChatFontScale | undefined,
  compact: boolean,
) {
  if (fontScale === 'small') {
    return compact
      ? fontScaleStyles.fontScaleSmallCompact
      : fontScaleStyles.fontScaleSmall;
  }
  if (fontScale === 'large') {
    return compact
      ? fontScaleStyles.fontScaleLargeCompact
      : fontScaleStyles.fontScaleLarge;
  }
  return undefined;
}

const createRichChatMessageStyles = (scheme: ColorScheme) =>
  StyleSheet.create({
    badge: {
      height: 18,
      marginRight: 4,
      width: 18,
    },
    badgeCompact: {
      height: 14,
      width: 14,
    },
    alternatingRowContainer: {
      backgroundColor: theme.color.rowAlt[scheme],
    },
    announcementColumn: {
      gap: 4,
      width: '100%',
    },
    announcementContainer: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.announcement),
      borderLeftColor: CHAT_NOTICE_ACCENTS.announcement,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    announcementMetaText: {
      color: CHAT_NOTICE_ACCENTS.announcement,
    },
    highlightMyMessageContainer: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.highlight),
      borderLeftColor: CHAT_NOTICE_ACCENTS.highlight,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    highlightMyMessageMetaText: {
      color: CHAT_NOTICE_ACCENTS.highlight,
    },
    charityDonationSurface: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.charity),
      borderLeftColor: CHAT_NOTICE_ACCENTS.charity,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    ritualNoticeSurface: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.ritual),
      borderLeftColor: CHAT_NOTICE_ACCENTS.ritual,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    ritualNoticeMetaText: {
      color: CHAT_NOTICE_ACCENTS.ritual,
    },
    customHighlightContainer: {
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    returningChatterMetaText: {
      color: CHAT_NOTICE_ACCENTS.returningChatter,
    },
    returningChatterNoticeSurface: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.returningChatter),
      borderLeftColor: CHAT_NOTICE_ACCENTS.returningChatter,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    firstMessageNoticeSurface: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.firstMessage),
      borderLeftColor: CHAT_NOTICE_ACCENTS.firstMessage,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    firstMessageMetaText: {
      color: CHAT_NOTICE_ACCENTS.firstMessage,
    },
    subscriptionNoticeSurface: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.subscription),
      borderLeftColor: CHAT_NOTICE_ACCENTS.subscription,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    stvEmoteNoticeSurface: {
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
      borderLeftWidth: 2,
    },
    stvEmoteAddedSurface: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.stvAdded),
      borderLeftColor: CHAT_NOTICE_ACCENTS.stvAdded,
    },
    stvEmoteRemovedSurface: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.stvRemoved),
      borderLeftColor: CHAT_NOTICE_ACCENTS.stvRemoved,
    },
    sharedChatLabelRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      marginBottom: 4,
    },
    sharedChatLabelText: {
      color: theme.color.notice.muted,
      fontSize: theme.fontSize11,
      fontWeight: '600',
      lineHeight: 14,
    },
    chatContainer: {
      minHeight: 0,
    },
    chatContainerCompact: {
      minHeight: 0,
    },
    moderatedBadge: {
      opacity: 0.72,
    },
    moderatedUsernameContainer: {
      opacity: 0.72,
    },
    messageLineModerated: {
      position: 'relative',
    },
    moderatedStrikeOverlay: {
      backgroundColor: theme.color.textSecondary[scheme],
      height: 1,
      left: 0,
      marginTop: -0.5,
      pointerEvents: 'none',
      position: 'absolute',
      right: 0,
      top: '50%',
      zIndex: 2,
    },
    highlightedSenderContainer: {
      backgroundColor: 'rgba(145, 71, 255, 0.08)',
      borderLeftColor: 'rgba(145, 71, 255, 0.38)',
      borderLeftWidth: 2,
      paddingLeft: 4,
    },
    highlightedReplyTargetContainer: {
      backgroundColor: theme.color.rowAlt[scheme],
      borderLeftColor: theme.color.borderStrong[scheme],
      borderLeftWidth: 2,
      paddingLeft: 4,
    },
    mention: {
      ...chatLineMetrics.comfortable,
      marginHorizontal: 2,
    },
    mentionCompact: {
      ...chatLineMetrics.compact,
      marginHorizontal: 1,
    },
    mentionDefaultColor: {
      color: theme.color.text[scheme],
    },
    mentionHighlighted: {
      fontWeight: '700',
    },
    messageLink: {
      ...chatLineMetrics.comfortable,
      color: theme.color.brand.twitch,
      textDecorationLine: 'underline',
    },
    messageLinkCompact: {
      ...chatLineMetrics.compact,
      color: theme.color.brand.twitch,
      textDecorationLine: 'underline',
    },
    messageColumn: {
      flexDirection: 'column',
      minWidth: 0,
      width: '100%',
    },
    messageLine: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      minWidth: 0,
      width: '100%',
    },
    messageLineInline: {
      minWidth: 0,
      width: '100%',
    },
    /**
     * Lines that contain inline emotes need a taller lineHeight than the
     * text metrics, otherwise the fixed lineHeight clips the emote image.
     * Must fit the emote attachment (30pt / 26pt compact) plus the font
     * descent, since attachments sit on the text baseline. Keep in sync with
     * the emote line height constants in util/pretextChatHeight.ts.
     */
    messageTextEmoteLine: {
      lineHeight: 34,
    },
    messageTextEmoteLineCompact: {
      lineHeight: 30,
    },
    replyContextEmoteLine: {
      lineHeight: 24,
    },
    messageText: {
      ...chatLineMetrics.comfortable,
    },
    messageTextCompact: {
      ...chatLineMetrics.compact,
    },
    messageTextPlaceholder: {
      borderRadius: 4,
      height: 12,
      marginHorizontal: 2,
      width: 96,
    },
    messageTextPlaceholderCompact: {
      height: 10,
      width: 78,
    },
    moderatedMessageText: {
      color: theme.color.textSecondary[scheme],
      textDecorationColor: theme.color.textSecondary[scheme],
      textDecorationLine: 'line-through',
    },
    moderatedUsernameText: {
      color: theme.color.textSecondary[scheme],
      textDecorationColor: theme.color.textSecondary[scheme],
      textDecorationLine: 'line-through',
    },
    ownMentionContainer: {
      backgroundColor: theme.color.violetSurface[scheme],
      borderLeftColor: theme.color.violet[scheme],
      borderLeftWidth: 2,
      paddingLeft: 6,
    },
    messageMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 4,
      minWidth: 0,
      width: '100%',
    },
    messageMetaText: {
      color: theme.color.textSecondary[scheme],
      flex: 1,
      flexShrink: 1,
      fontSize: theme.fontSize12,
      lineHeight: 15,
      minWidth: 0,
    },
    messageMetaTextCompact: {
      fontSize: theme.fontSize11,
      lineHeight: 14,
    },
    messageMetaTextStrong: {
      fontWeight: '600',
    },
    replyContextRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minWidth: 0,
      marginBottom: 4,
      width: '100%',
    },
    replyContextContent: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
      overflow: 'hidden',
    },
    replyContextBody: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      minWidth: 0,
      overflow: 'hidden',
    },
    replyContextBodyParts: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      flexShrink: 1,
      minWidth: 0,
      overflow: 'hidden',
    },
    replyContextRowReplyToYou: {
      alignSelf: 'stretch',
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.replyToYou, 0.14),
      borderRadius: 4,
      marginBottom: 4,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    replyContextRowInteractive: {
      alignSelf: 'stretch',
    },
    replyContextIcon: {
      marginRight: 4,
      opacity: 0.8,
    },
    replyContextIconReplyToYou: {
      opacity: 1,
    },
    replyContextText: {
      color: theme.color.textSecondary[scheme],
      fontSize: theme.fontSize12,
      lineHeight: 15,
    },
    replyContextPrefixText: {
      color: theme.color.textSecondary[scheme],
      flexShrink: 1,
      fontSize: theme.fontSize12,
      lineHeight: 15,
      minWidth: 0,
    },
    replyContextBodyText: {
      color: theme.color.textSecondary[scheme],
      fontSize: theme.fontSize12,
      lineHeight: 15,
    },
    replyContextTextReplyToYou: {
      color: CHAT_NOTICE_ACCENTS.replyToYou,
      fontWeight: '600',
    },
    replyContextTextCompact: {
      fontSize: theme.fontSize11,
      lineHeight: 14,
    },
    rewardMessageContainer: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.channelPoints),
      borderLeftColor: CHAT_NOTICE_ACCENTS.channelPoints,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    channelPointsMetaText: {
      color: CHAT_NOTICE_ACCENTS.channelPoints,
    },
    channelPointsMetaMuted: {
      color: theme.color.textSecondary[scheme],
      fontSize: theme.fontSize12,
      fontWeight: '400',
      lineHeight: 15,
    },
    channelPointsMetaName: {
      color: theme.color.text[scheme],
      fontSize: theme.fontSize12,
      fontWeight: '700',
      lineHeight: 15,
    },
    channelPointsMetaReward: {
      color: theme.color.text[scheme],
      fontSize: theme.fontSize12,
      fontWeight: '600',
      lineHeight: 15,
    },
    raidNoticeSurface: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.raid),
      borderLeftColor: CHAT_NOTICE_ACCENTS.raid,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    raidNoticeMetaText: {
      color: CHAT_NOTICE_ACCENTS.raid,
    },
    raidNoticeText: {
      color: theme.color.text[scheme],
      fontSize: theme.fontSize12,
      fontWeight: '600',
      lineHeight: 15,
      textAlign: 'left',
    },
    stvSystemRowAlignStart: {
      alignItems: 'flex-start',
    },
    subscriptionNoticeColumn: {
      gap: 4,
      width: '100%',
    },
    subscriptionNoticeMetaText: {
      color: CHAT_NOTICE_ACCENTS.subscription,
    },
    systemMessageContainer: {
      justifyContent: 'flex-start',
    },
    systemMessageRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
    },
    systemMessageText: {
      color: theme.color.textSecondary[scheme],
      fontSize: theme.fontSize14,
      lineHeight: 17,
      textAlign: 'left',
    },
    timestamp: {
      color: theme.color.textFaint[scheme],
      fontSize: theme.fontSize11,
      lineHeight: 15,
      marginRight: 4,
    },
    timestampCompact: {
      fontSize: 10,
      lineHeight: 14,
      marginRight: 4,
    },
    usernameText: {
      ...chatLineMetrics.comfortable,
      fontWeight: '700',
    },
    usernameTextCompact: {
      ...chatLineMetrics.compact,
      fontWeight: '700',
    },
    viewerMilestoneContainer: {
      backgroundColor: noticeSurfaceTint(CHAT_NOTICE_ACCENTS.viewerMilestone),
      borderLeftColor: CHAT_NOTICE_ACCENTS.viewerMilestone,
      borderLeftWidth: 2,
      marginVertical: 2,
      paddingHorizontal: theme.space8,
      paddingVertical: theme.space4,
    },
    viewerMilestoneMetaText: {
      color: CHAT_NOTICE_ACCENTS.viewerMilestone,
    },
    viewerMilestoneRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
    },
    charityDonationRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
    },
  });

const richChatMessageStyles = {
  light: createRichChatMessageStyles('light'),
  dark: createRichChatMessageStyles('dark'),
} as const;

export function getRichChatMessageStyles(scheme: ColorScheme) {
  return richChatMessageStyles[scheme];
}
