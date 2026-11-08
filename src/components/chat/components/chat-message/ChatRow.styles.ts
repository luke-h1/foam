import { StyleSheet, type ViewStyle } from 'react-native';

import {
  CHAT_NOTICE_ACCENTS,
  noticeSurfaceTint,
} from '@app/components/chat/util/chatNoticeAccents';
import { theme } from '@app/styles/themes';

import { CHAT_SURFACE_COLORS } from './util/chatScale';

/**
 * Colour half of a notice surface. The padding, margin and accent-bar width
 * follow the chat scale and come from `getChatTextStyles().surface`.
 */
function noticeSurface(accent: string, alpha?: number): ViewStyle {
  return {
    backgroundColor: noticeSurfaceTint(accent, alpha),
    borderLeftColor: accent,
  };
}

export const styles = StyleSheet.create({
  alternatingRowContainer: {
    backgroundColor: CHAT_SURFACE_COLORS.alternatingRow,
  },
  announcementColumn: {
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
  },
  highlightedReplyTargetContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
    borderLeftWidth: CHAT_SURFACE_COLORS.accentBarWidth,
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
  },
  messageMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
    borderCurve: 'continuous',
  },
  replyContextRowInteractive: {
    alignSelf: 'stretch',
  },
  replyContextPrefixFlex: {
    flexShrink: 1,
    minWidth: 0,
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
  subscriptionNoticeColumn: {
    width: '100%',
  },
  subscriptionNoticeMetaText: {
    color: CHAT_NOTICE_ACCENTS.subscription,
  },
  systemMessageContainer: {
    justifyContent: 'flex-start',
  },
  /**
   * The one row every chat notice body renders into. Kept single so a milestone,
   * charity or raid notice cannot drift away from a plain system notice.
   */
  noticeRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  systemMessageText: {
    color: theme.color.textSecondary.dark,
    textAlign: 'left',
  },
  modAnniversarySurface: noticeSurface(CHAT_NOTICE_ACCENTS.modAnniversary),
  modAnniversaryMetaText: {
    color: CHAT_NOTICE_ACCENTS.modAnniversary,
  },
  viewerMilestoneContainer: noticeSurface(CHAT_NOTICE_ACCENTS.viewerMilestone),
  viewerMilestoneMetaText: {
    color: CHAT_NOTICE_ACCENTS.viewerMilestone,
  },
});
