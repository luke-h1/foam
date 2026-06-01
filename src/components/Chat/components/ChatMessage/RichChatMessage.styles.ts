import { theme } from '@app/styles/themes';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  badge: {
    height: 20,
    marginRight: 2,
    width: 20,
  },
  badgeCompact: {
    height: 16,
    width: 16,
  },
  chatContainer: {
    minHeight: 0,
    paddingVertical: 0,
  },
  chatContainerCompact: {
    minHeight: 0,
    paddingVertical: 0,
  },
  moderatedBadge: {
    opacity: 0.72,
  },
  moderatedUsernameContainer: {
    opacity: 0.72,
  },
  highlightedSenderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
    borderLeftWidth: 2,
    paddingLeft: theme.space8,
  },
  highlightedReplyTargetContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.08)',
    borderLeftColor: 'rgba(145, 71, 255, 0.42)',
    borderLeftWidth: 2,
    paddingLeft: theme.space8,
  },
  inlineIndicatorText: {
    color: 'rgba(145, 71, 255, 0.72)',
    fontSize: theme.fontSize11,
    fontWeight: '600',
    marginRight: 4,
    textTransform: 'lowercase',
  },
  inlineIndicatorTextCompact: {
    marginRight: 2,
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
    width: '100%',
  },
  messageLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
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
    backgroundColor: 'rgba(145, 71, 255, 0.06)',
    borderLeftColor: theme.colorViolet,
    borderLeftWidth: 2,
    paddingLeft: theme.space8,
  },
  replyContainer: {
    borderLeftColor: 'rgba(145, 71, 255, 0.28)',
    borderLeftWidth: 2,
    marginBottom: theme.space12,
    marginLeft: theme.space8,
    paddingLeft: theme.space8,
  },
  replyContextBody: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    maxWidth: '75%',
  },
  replyContextBodyCompact: {
    fontSize: theme.fontSize11,
  },
  replyContextLabel: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '600',
  },
  replyContextLabelCompact: {
    fontSize: theme.fontSize11,
  },
  replyContextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    marginBottom: 2,
  },
  replyContextRowInteractive: {
    alignSelf: 'flex-start',
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
    color: theme.colorGreyAlpha,
    fontSize: theme.fontSize11,
  },
  timestampCompact: {
    fontSize: 10,
    marginRight: 2,
  },
  usernameButton: {
    alignSelf: 'center',
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
