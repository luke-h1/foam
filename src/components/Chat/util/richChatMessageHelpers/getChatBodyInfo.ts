import { deriveChatBody } from '@app/utils/chat/deriveChatBody';
import type { ChatBodyVariant } from '@app/utils/chat/deriveChatBody/types';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

export interface ChatBodyInfo {
  hasSubscriptionNotice: boolean;
  mentionsCurrentUser: boolean;
  variant: ChatBodyVariant;
}

export function getChatBodyInfo(
  message: ParsedPart[],
  normalisedCurrentUsername?: string,
  sender?: string,
  isTwitchSystemNotice?: boolean,
  isAnnouncement?: boolean,
): ChatBodyInfo {
  const derived = deriveChatBody(message, {
    sender,
    isTwitchSystemNotice,
    isAnnouncement,
  });

  return {
    hasSubscriptionNotice: derived.hasSubscriptionNotice,
    mentionsCurrentUser: normalisedCurrentUsername
      ? derived.mentionLogins.includes(normalisedCurrentUsername)
      : false,
    variant: derived.variant,
  };
}
