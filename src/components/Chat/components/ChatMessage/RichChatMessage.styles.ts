import { theme } from '@app/styles/themes';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  badge: {
    height: 18,
    marginRight: 4,
    marginTop: 1,
    width: 18,
  },
  badgeCompact: {
    height: 14,
    width: 14,
  },
  alternatingRowContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
    fontSize: theme.fontSize14,
    lineHeight: 17,
    marginHorizontal: 2,
  },
  mentionCompact: {
    fontSize: theme.fontSize11,
    lineHeight: 14,
    marginHorizontal: 1,
  },
  mentionDefaultColor: {
    color: '#FFFFFF',
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
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    minWidth: 0,
    width: '100%',
  },
  messageText: {
    fontSize: theme.fontSize14,
    lineHeight: 17,
  },
  messageTextCompact: {
    fontSize: theme.fontSize11,
    lineHeight: 14,
  },
  moderatedMessageText: {
    color: 'rgba(214, 214, 217, 0.72)',
    fontStyle: 'italic',
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
  replyContextRowInteractive: {
    alignSelf: 'stretch',
  },
  replyContextIcon: {
    marginRight: 4,
    opacity: 0.8,
  },
  replyContextText: {
    color: 'rgba(255,255,255,0.5)',
    flex: 1,
    flexShrink: 1,
    fontSize: theme.fontSize12,
    lineHeight: 15,
    minWidth: 0,
  },
  replyContextTextCompact: {
    fontSize: theme.fontSize11,
    lineHeight: 14,
  },
  rewardMessageContainer: {
    backgroundColor: 'rgba(127, 127, 127, 0.04)',
    borderLeftColor: theme.colorViolet,
    borderLeftWidth: 2,
    marginVertical: 2,
    paddingLeft: theme.space8,
    paddingRight: theme.space8,
    paddingVertical: 2,
  },
  rewardSummaryMuted: {
    color: theme.color.textSecondary.dark,
    fontWeight: '400',
  },
  rewardSummaryName: {
    color: theme.color.text.dark,
    fontWeight: '700',
  },
  rewardSummaryRewardTitle: {
    color: theme.color.text.dark,
    fontWeight: '700',
  },
  rewardSummaryRow: {
    marginBottom: theme.space8,
    width: '100%',
  },
  rewardSummaryText: {
    flexWrap: 'wrap',
    fontSize: theme.fontSize14,
    lineHeight: 17,
  },
  stvSystemRowAlignStart: {
    alignItems: 'flex-start',
  },
  subscriptionNoticeContainer: {
    width: '100%',
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
  usernameButton: {
    alignSelf: 'flex-start',
  },
  usernameCompact: {
    fontSize: theme.fontSize11,
  },
  viewerMilestoneContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.05)',
    borderLeftColor: theme.colorViolet,
    borderLeftWidth: 2,
    marginVertical: 2,
    paddingHorizontal: theme.space8,
    paddingVertical: 2,
  },
  viewerMilestoneRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
});
