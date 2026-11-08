export interface ReplyFlags {
  canJumpToReplyTarget: boolean;
  isFirstMessage: boolean;
  isReturningChatter?: boolean;
  isReplyingToCurrentUser: boolean;
  shouldRenderInlineReply: boolean;
  showChannelPointsRewardChrome: boolean;
  showTimestamp: boolean;
}
