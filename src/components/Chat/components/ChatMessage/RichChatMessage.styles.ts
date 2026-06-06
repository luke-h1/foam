import {
  CHAT_NOTICE_ACCENTS,
  noticeSurfaceTint,
} from '../util/chatNoticeAccents';
import { theme } from '@app/styles/themes';
import { StyleSheet } from 'react-native';

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

export const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
    color: '#ADADB8',
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
    backgroundColor: 'rgba(214, 214, 217, 0.72)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
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
    color: '#FFFFFF',
  },
  mentionHighlighted: {
    fontWeight: '700',
  },
  messageLink: {
    ...chatLineMetrics.comfortable,
    color: '#9147FF',
    textDecorationLine: 'underline',
  },
  messageLinkCompact: {
    ...chatLineMetrics.compact,
    color: '#9147FF',
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
    color: 'rgba(214, 214, 217, 0.72)',
    textDecorationColor: 'rgba(214, 214, 217, 0.85)',
    textDecorationLine: 'line-through',
  },
  moderatedUsernameText: {
    color: 'rgba(214, 214, 217, 0.72)',
    textDecorationColor: 'rgba(214, 214, 217, 0.85)',
    textDecorationLine: 'line-through',
  },
  ownMentionContainer: {
    backgroundColor: 'rgba(96, 72, 150, 0.2)',
    borderLeftColor: theme.colorViolet,
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
    color: 'rgba(255,255,255,0.5)',
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
    flexWrap: 'nowrap',
    minWidth: 0,
    overflow: 'hidden',
  },
  replyContextBodyParts: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'nowrap',
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
    color: 'rgba(255,255,255,0.5)',
    flex: 1,
    flexShrink: 1,
    fontSize: theme.fontSize12,
    lineHeight: 15,
    minWidth: 0,
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
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    fontWeight: '400',
    lineHeight: 15,
  },
  channelPointsMetaName: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '700',
    lineHeight: 15,
  },
  channelPointsMetaReward: {
    color: theme.color.text.dark,
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
    color: theme.color.text.dark,
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
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize14,
    lineHeight: 17,
    textAlign: 'left',
  },
  timestamp: {
    color: 'rgba(255,255,255,0.5)',
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
