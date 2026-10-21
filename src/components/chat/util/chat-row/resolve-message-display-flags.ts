import type { ChatMessageDisplayFlags } from '@app/components/chat/types/chat-ui-flags';

interface ResolveMessageDisplayFlagsOptions {
  isAnnouncement?: boolean | undefined;
  isChannelPointRedemption?: boolean | undefined;
  isHighlightedMessage?: boolean | undefined;
  isSharedChatDuplicated?: boolean | undefined;
  isTwitchSystemNotice?: boolean | undefined;
  messageDisplay?: ChatMessageDisplayFlags | undefined;
}

/**
 * Flags a message carries in its own data default from the message; the
 * renderer's messageDisplay wins wherever it sets one.
 */
export function resolveMessageDisplayFlags({
  isAnnouncement: messageIsAnnouncement = false,
  isChannelPointRedemption: messageIsChannelPointRedemption = false,
  isHighlightedMessage: messageIsHighlightedMessage = false,
  isSharedChatDuplicated: messageIsSharedChatDuplicated = false,
  isTwitchSystemNotice: messageIsTwitchSystemNotice = false,
  messageDisplay,
}: ResolveMessageDisplayFlagsOptions) {
  const {
    disableEmoteAnimations = false,
    isChannelPointRedemption = messageIsChannelPointRedemption,
    isAnnouncement = messageIsAnnouncement,
    isHighlightedMessage = messageIsHighlightedMessage,
    isSharedChatDuplicated = messageIsSharedChatDuplicated,
    isTwitchSystemNotice = messageIsTwitchSystemNotice,
    showInlineReplyContext = true,
    showTimestamp = true,
    isAlternatingRow = false,
    isHighlightedMessageTarget = false,
  } = messageDisplay ?? {};

  return {
    disableEmoteAnimations,
    displayIsSharedChatDuplicated: isSharedChatDuplicated,
    isAlternatingRow,
    isAnnouncement,
    isChannelPointRedemption,
    isHighlightedMessage,
    isHighlightedMessageTarget,
    isTwitchSystemNotice,
    showInlineReplyContext,
    showTimestamp,
  };
}
