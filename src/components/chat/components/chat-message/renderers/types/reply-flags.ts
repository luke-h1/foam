/**
 * The reply and first-time flags a chat row draws its meta header from.
 */
export interface ReplyFlags {
  canJumpToReplyTarget: boolean;
  isFirstMessage: boolean;
  isReturningChatter?: boolean;
  isReplyingToCurrentUser: boolean;
  shouldRenderInlineReply: boolean;
  showChannelPointsRewardChrome: boolean;
  showTimestamp: boolean;
}
