import { StyleSheet, type ViewStyle } from 'react-native';

import { theme } from '@app/styles/themes';

import {
  CHAT_NOTICE_ACCENTS,
  noticeSurfaceTint,
} from '../util/chatNoticeAccents';
import {
  CHAT_SURFACE_COLORS,
  type ChatFontScale,
  getChatScale,
} from './chatScale';

export type { ChatFontScale };

export interface ChatLineMetrics {
  fontSize: number;
  lineHeight: number;
}

export const chatLineMetrics = {
  comfortable: {
    fontSize: getChatScale('default', 'comfortable').bodyFontSize,
    lineHeight: getChatScale('default', 'comfortable').bodyLineHeight,
  },
  compact: {
    fontSize: getChatScale('default', 'compact').bodyFontSize,
    lineHeight: getChatScale('default', 'compact').bodyLineHeight,
  },
} as const satisfies Record<string, ChatLineMetrics>;

/**
 * Colour half of a notice surface. The padding, margin and accent-bar width are
 * shared and live in `noticeSurface` so a new notice type cannot drift.
 */
function noticeSurface(accent: string, alpha?: number): ViewStyle {
  return {
    backgroundColor: noticeSurfaceTint(accent, alpha),
    borderLeftColor: accent,
    borderLeftWidth: CHAT_SURFACE_COLORS.accentBarWidth,
    marginVertical: 2,
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space4,
  };
}

export const styles = StyleSheet.create({
  alternatingRowContainer: {
    backgroundColor: CHAT_SURFACE_COLORS.alternatingRow,
  },
  announcementColumn: {
    gap: 4,
    width: '100%',
  },
  announcementContainer: noticeSurface(CHAT_NOTICE_ACCENTS.announcement),
  announcementMetaText: {
    color: CHAT_NOTICE_ACCENTS.announcement,
  },
  highlightMyMessageContainer: noticeSurface(CHAT_NOTICE_ACCENTS.highlight),
  highlightMyMessageMetaText: {
    color: CHAT_NOTICE_ACCENTS.highlight,
  },
  charityDonationSurface: noticeSurface(CHAT_NOTICE_ACCENTS.charity),
  ritualNoticeSurface: noticeSurface(CHAT_NOTICE_ACCENTS.ritual),
  ritualNoticeMetaText: {
    color: CHAT_NOTICE_ACCENTS.ritual,
  },
  customHighlightContainer: {
    borderLeftWidth: CHAT_SURFACE_COLORS.accentBarWidth,
    marginVertical: 2,
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space4,
  },
  returningChatterMetaText: {
    color: CHAT_NOTICE_ACCENTS.returningChatter,
  },
  returningChatterNoticeSurface: noticeSurface(
    CHAT_NOTICE_ACCENTS.returningChatter,
  ),
  firstMessageNoticeSurface: noticeSurface(CHAT_NOTICE_ACCENTS.firstMessage),
  firstMessageMetaText: {
    color: CHAT_NOTICE_ACCENTS.firstMessage,
  },
  subscriptionNoticeSurface: noticeSurface(CHAT_NOTICE_ACCENTS.subscription),
  stvEmoteNoticeSurface: {
    borderLeftWidth: CHAT_SURFACE_COLORS.accentBarWidth,
    marginVertical: 2,
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space4,
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
    color: CHAT_SURFACE_COLORS.muted,
    fontWeight: '600',
  },
  chatContainer: {
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
    backgroundColor: CHAT_SURFACE_COLORS.strike,
    height: 1,
    left: 0,
    marginTop: -0.5,
    opacity: 0.72,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: '50%',
    zIndex: 2,
  },
  highlightedSenderContainer: {
    backgroundColor: noticeSurfaceTint(theme.color.brand.twitch, 0.08),
    borderLeftColor: theme.color.brand.twitch,
    borderLeftWidth: CHAT_SURFACE_COLORS.accentBarWidth,
    paddingLeft: 4,
  },
  highlightedReplyTargetContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
    borderLeftWidth: CHAT_SURFACE_COLORS.accentBarWidth,
    paddingLeft: 4,
  },
  mentionHighlighted: {
    fontWeight: '700',
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
  moderatedMessageText: {
    color: CHAT_SURFACE_COLORS.muted,
    opacity: 0.72,
    textDecorationColor: CHAT_SURFACE_COLORS.muted,
    textDecorationLine: 'line-through',
  },
  moderatedUsernameText: {
    color: CHAT_SURFACE_COLORS.muted,
    opacity: 0.72,
    textDecorationColor: CHAT_SURFACE_COLORS.muted,
    textDecorationLine: 'line-through',
  },
  ownMentionContainer: {
    backgroundColor: noticeSurfaceTint(theme.colorViolet, 0.16),
    borderLeftColor: theme.colorViolet,
    borderLeftWidth: CHAT_SURFACE_COLORS.accentBarWidth,
    paddingLeft: 6,
  },
  messageMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
    minWidth: 0,
    width: '100%',
  },
  messageMetaTextFlex: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
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
    borderRadius: CHAT_SURFACE_COLORS.radius,
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  replyContextRowInteractive: {
    alignSelf: 'stretch',
  },
  replyContextPrefixFlex: {
    flexShrink: 1,
    minWidth: 0,
  },
  replyContextIcon: {
    marginRight: 4,
    opacity: 0.8,
  },
  replyContextIconReplyToYou: {
    opacity: 1,
  },
  replyContextTextReplyToYou: {
    color: CHAT_NOTICE_ACCENTS.replyToYou,
    fontWeight: '600',
  },
  rewardMessageContainer: noticeSurface(CHAT_NOTICE_ACCENTS.channelPoints),
  channelPointsMetaText: {
    color: CHAT_NOTICE_ACCENTS.channelPoints,
  },
  channelPointsMetaMuted: {
    color: theme.color.textSecondary.dark,
    fontWeight: '400',
  },
  channelPointsMetaName: {
    color: theme.color.text.dark,
    fontWeight: '700',
  },
  channelPointsMetaReward: {
    color: theme.color.text.dark,
    fontWeight: '600',
  },
  raidNoticeSurface: noticeSurface(CHAT_NOTICE_ACCENTS.raid),
  raidNoticeMetaText: {
    color: CHAT_NOTICE_ACCENTS.raid,
  },
  raidNoticeText: {
    color: theme.color.text.dark,
    fontWeight: '600',
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
    color: theme.color.textSecondary.dark,
    textAlign: 'left',
  },
  viewerMilestoneContainer: noticeSurface(CHAT_NOTICE_ACCENTS.viewerMilestone),
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
