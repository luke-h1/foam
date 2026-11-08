import type { ChatMessageDisplayFlags } from '@app/components/chat/types/chat-ui-flags';

interface ResolveMessageDisplayFlagsOptions {
  isAnnouncement?: boolean;
  isChannelPointRedemption?: boolean;
  isHighlightedMessage?: boolean;
  isSharedChatDuplicated?: boolean;
  isTwitchSystemNotice?: boolean;
  messageDisplay?: ChatMessageDisplayFlags;
}

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
