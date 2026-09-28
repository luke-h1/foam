import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normalise-chat-username';

interface GetReplyFlagsOptions {
  normalisedCurrentUsername: string;
  onReplyContextPress: ((replyParentMessageId: string) => void) | undefined;
  parentDisplayName: string | undefined;
  replyBody: string | undefined;
  replyDisplayName: string | undefined;
  showInlineReplyContext: boolean;
  userstate: UserStateTags;
}

/**
 * The reply and first-time flags a row reads off its userstate tags.
 */
export function getReplyFlags({
  normalisedCurrentUsername,
  onReplyContextPress,
  parentDisplayName,
  replyBody,
  replyDisplayName,
  showInlineReplyContext,
  userstate,
}: GetReplyFlagsOptions) {
  const isReply = Boolean(parentDisplayName);
  const replyParentMessageId = userstate['reply-parent-msg-id'];
  const isFirstMessage = userstate['first-msg'] === '1';

  return {
    canJumpToReplyTarget:
      Boolean(onReplyContextPress) && Boolean(replyParentMessageId),
    isFirstMessage,
    isReplyingToCurrentUser: Boolean(
      normalisedCurrentUsername &&
      (normaliseChatUsername(replyDisplayName) === normalisedCurrentUsername ||
        normaliseChatUsername(parentDisplayName) === normalisedCurrentUsername),
    ),
    isReturningChatter:
      !isFirstMessage && userstate['returning-chatter'] === '1',
    replyParentMessageId,
    shouldRenderInlineReply:
      showInlineReplyContext &&
      isReply &&
      Boolean(replyBody || parentDisplayName),
  };
}
